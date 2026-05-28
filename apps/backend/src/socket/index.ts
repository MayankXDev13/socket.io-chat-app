import http from 'http';
import { Server } from 'socket.io';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { messages, roomMembers, users } from '../db/schema';
import { verifyAccessToken } from '../lib/jwt';
import { sendMessageSchema } from '@repo/shared';

export function setupSocketIO(httpServer: http.Server) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} (socket: ${socket.id})`);

    // Broadcast online status
    io.emit('user_online', userId);

    // Join room
    socket.on('join_room', async (roomId: string) => {
      try {
        const membership = await db.query.roomMembers.findFirst({
          where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
        });
        if (membership) {
          socket.join(roomId);
          console.log(`User ${userId} joined room ${roomId}`);
        }
      } catch (error) {
        socket.emit('error', 'Failed to join room');
      }
    });

    // Leave room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room ${roomId}`);
    });

    // Send message
    socket.on('send_message', async (data: { roomId: string; content: string }) => {
      try {
        const parsed = sendMessageSchema.parse(data);

        const membership = await db.query.roomMembers.findFirst({
          where: and(eq(roomMembers.roomId, parsed.roomId), eq(roomMembers.userId, userId)),
        });
        if (!membership) {
          socket.emit('error', 'Not a member of this room');
          return;
        }

        const sender = await db.query.users.findFirst({ where: eq(users.id, userId) });

        const [message] = await db.insert(messages).values({
          roomId: parsed.roomId,
          senderId: userId,
          content: parsed.content,
        }).returning();

        const fullMessage = {
          id: message.id,
          roomId: message.roomId,
          senderId: message.senderId,
          senderUsername: sender?.username || 'Unknown',
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        };

        io.to(parsed.roomId).emit('receive_message', fullMessage);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Typing indicators
    socket.on('typing', async (roomId: string) => {
      const sender = await db.query.users.findFirst({ where: eq(users.id, userId) });
      socket.to(roomId).emit('user_typing', {
        roomId,
        userId,
        username: sender?.username || 'Unknown',
      });
    });

    socket.on('stop_typing', (roomId: string) => {
      socket.to(roomId).emit('user_stop_typing', { roomId, userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      io.emit('user_offline', userId);
    });
  });

  return io;
}
