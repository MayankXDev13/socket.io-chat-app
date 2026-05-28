import { Router, Request, Response } from 'express';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { rooms, roomMembers, messages, users } from '../db/schema';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRoomSchema, addMemberSchema } from '@repo/shared';

const router = Router();
router.use(authenticate);

// POST / - Create room
router.post('/', validate(createRoomSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, memberIds, isGroup } = req.body;
    const userId = req.user!.id;

    if (!isGroup) {
      if (memberIds.length !== 1) {
        res.status(400).json({ message: 'DM must have exactly one other member.' });
        return;
      }

      const otherUserId = memberIds[0];

      // Find existing DM between these two users
      const existingRooms = await db
        .select({ roomId: roomMembers.roomId })
        .from(roomMembers)
        .innerJoin(rooms, eq(rooms.id, roomMembers.roomId))
        .where(and(eq(rooms.isGroup, false), eq(roomMembers.userId, userId)));

      for (const er of existingRooms) {
        const otherMember = await db.query.roomMembers.findFirst({
          where: and(eq(roomMembers.roomId, er.roomId), eq(roomMembers.userId, otherUserId)),
        });
        if (otherMember) {
          const room = await db.query.rooms.findFirst({ where: eq(rooms.id, er.roomId) });
          res.json(room);
          return;
        }
      }

      const [room] = await db.insert(rooms).values({ name: null, isGroup: false, createdBy: userId }).returning();
      await db.insert(roomMembers).values([
        { roomId: room.id, userId },
        { roomId: room.id, userId: otherUserId },
      ]);
      res.status(201).json(room);
    } else {
      if (!name) {
        res.status(400).json({ message: 'Group name is required.' });
        return;
      }

      const [room] = await db.insert(rooms).values({ name, isGroup: true, createdBy: userId }).returning();
      const allMembers = [userId, ...memberIds.filter((id: string) => id !== userId)];
      await db.insert(roomMembers).values(
        allMembers.map((memberId: string) => ({ roomId: room.id, userId: memberId }))
      );
      res.status(201).json(room);
    }
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET / - List rooms
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const memberRooms = await db
      .select({ roomId: roomMembers.roomId })
      .from(roomMembers)
      .where(eq(roomMembers.userId, userId));

    if (memberRooms.length === 0) {
      res.json([]);
      return;
    }

    const roomIds = memberRooms.map((r) => r.roomId);
    const roomList = await db.select().from(rooms).where(inArray(rooms.id, roomIds));

    const enrichedRooms = await Promise.all(
      roomList.map(async (room) => {
        const [lastMsg] = await db
          .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            senderUsername: users.username,
            createdAt: messages.createdAt,
            roomId: messages.roomId,
          })
          .from(messages)
          .leftJoin(users, eq(users.id, messages.senderId))
          .where(eq(messages.roomId, room.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const [countResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(roomMembers)
          .where(eq(roomMembers.roomId, room.id));

        const members = await db
          .select({
            id: roomMembers.id,
            userId: roomMembers.userId,
            username: users.username,
            joinedAt: roomMembers.joinedAt,
          })
          .from(roomMembers)
          .leftJoin(users, eq(users.id, roomMembers.userId))
          .where(eq(roomMembers.roomId, room.id));

        return {
          ...room,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                roomId: lastMsg.roomId,
                senderId: lastMsg.senderId,
                senderUsername: lastMsg.senderUsername || 'Unknown',
                content: lastMsg.content,
                createdAt: lastMsg.createdAt.toISOString(),
              }
            : null,
          memberCount: countResult?.count || 0,
          members: members.map((m) => ({
            id: m.id,
            userId: m.userId,
            username: m.username || 'Unknown',
            joinedAt: m.joinedAt.toISOString(),
          })),
        };
      })
    );

    enrichedRooms.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    res.json(enrichedRooms);
  } catch (error) {
    console.error('List rooms error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /:id - Get room details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const roomId = req.params.id;

    const membership = await db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
    });

    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this room.' });
      return;
    }

    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room) {
      res.status(404).json({ message: 'Room not found.' });
      return;
    }

    const members = await db
      .select({
        id: roomMembers.id,
        userId: roomMembers.userId,
        username: users.username,
        joinedAt: roomMembers.joinedAt,
      })
      .from(roomMembers)
      .leftJoin(users, eq(users.id, roomMembers.userId))
      .where(eq(roomMembers.roomId, roomId));

    res.json({
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      memberCount: members.length,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        username: m.username || 'Unknown',
        joinedAt: m.joinedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /:id/members - Add member to group
router.post('/:id/members', validate(addMemberSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const roomId = req.params.id;
    const { userId: targetUserId } = req.body;

    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || !room.isGroup) {
      res.status(400).json({ message: 'Can only add members to group chats.' });
      return;
    }
    if (room.createdBy !== userId) {
      res.status(403).json({ message: 'Only the group creator can add members.' });
      return;
    }

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });
    if (!targetUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const existing = await db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetUserId)),
    });
    if (existing) {
      res.status(409).json({ message: 'User is already a member.' });
      return;
    }

    await db.insert(roomMembers).values({ roomId, userId: targetUserId });
    res.json({ message: 'Member added successfully.' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /:id/members/:userId - Remove member from group
router.delete('/:id/members/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const roomId = req.params.id;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      res.status(400).json({ message: 'Cannot remove yourself from the group.' });
      return;
    }

    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || !room.isGroup) {
      res.status(400).json({ message: 'Can only remove members from group chats.' });
      return;
    }
    if (room.createdBy !== currentUserId) {
      res.status(403).json({ message: 'Only the group creator can remove members.' });
      return;
    }

    await db.delete(roomMembers).where(
      and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, targetUserId))
    );
    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
