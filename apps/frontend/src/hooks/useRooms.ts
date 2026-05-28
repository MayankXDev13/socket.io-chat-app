import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Room } from '@repo/shared';
import api from '@/lib/api';

export function useRooms() {
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await api.get('/rooms');
      return data;
    },
  });

  const createRoom = useMutation({
    mutationFn: async (payload: { name?: string; memberIds: string[]; isGroup: boolean }) => {
      const { data } = await api.post('/rooms', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const addMember = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { data } = await api.post(`/rooms/${roomId}/members`, { roomId, userId });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const removeMember = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { data } = await api.delete(`/rooms/${roomId}/members/${userId}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  return { rooms, isLoading, createRoom, addMember, removeMember };
}
