import { z } from 'zod';

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  sendMessageSchema,
  createRoomSchema,
  addMemberSchema,
  removeMemberSchema,
  paginationSchema,
  searchUsersSchema,
} from '../schemas/index';

// ─── Inferred Schema Types ──────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

export type SearchUsersInput = z.infer<typeof searchUsersSchema>;

// ─── Domain Interfaces ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
}

export interface RoomMember {
  id: string;
  userId: string;
  username: string;
  joinedAt: string;
}

export interface Room {
  id: string;
  name: string | null;
  isGroup: boolean;
  createdBy: string;
  createdAt: string;
  lastMessage: Message | null;
  memberCount: number;
  members: RoomMember[];
}

// ─── Generic Paginated Response ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Socket.IO Event Maps ───────────────────────────────────────────────────

export interface ServerToClientEvents {
  receive_message: (message: Message) => void;
  user_typing: (data: { roomId: string; userId: string; username: string }) => void;
  user_stop_typing: (data: { roomId: string; userId: string }) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  room_updated: (room: Room) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  send_message: (data: { roomId: string; content: string }) => void;
  typing: (roomId: string) => void;
  stop_typing: (roomId: string) => void;
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
