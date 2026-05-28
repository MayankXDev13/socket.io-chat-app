import { Router, Request, Response } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { messages, roomMembers, users } from '../db/schema';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paginationSchema } from '@repo/shared';

const router = Router();
router.use(authenticate);

// GET /:roomId/messages
router.get('/:roomId/messages', validate(paginationSchema, 'query'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const roomId = req.params.roomId;
    const { page, limit } = req.query as unknown as { page: number; limit: number };

    const membership = await db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
    });
    if (!membership) {
      res.status(403).json({ message: 'You are not a member of this room.' });
      return;
    }

    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.roomId, roomId));

    const total = countResult?.count || 0;

    const messageList = await db
      .select({
        id: messages.id,
        roomId: messages.roomId,
        senderId: messages.senderId,
        senderUsername: users.username,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(users.id, messages.senderId))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      data: messageList.map((m) => ({
        ...m,
        senderUsername: m.senderUsername || 'Unknown',
        createdAt: m.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
