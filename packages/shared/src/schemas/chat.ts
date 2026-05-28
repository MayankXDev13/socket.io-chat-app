import { z } from 'zod';

export const sendMessageSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message cannot exceed 5000 characters'),
});

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name must be at least 1 character')
    .max(100, 'Room name must be at most 100 characters')
    .optional(),
  memberIds: z
    .array(z.string().uuid('Invalid member ID'))
    .min(1, 'At least one member is required'),
  isGroup: z.boolean(),
});

export const addMemberSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export const removeMemberSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
