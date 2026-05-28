import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useMemo } from 'react';
import type { Message, PaginatedResponse } from '@repo/shared';
import api from '@/lib/api';
import { getSocket } from '@/socket/socket';

export function useMessages(roomId: string | undefined) {
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<PaginatedResponse<Message>>({
      queryKey: ['messages', roomId],
      queryFn: async ({ pageParam }) => {
        const { data } = await api.get(`/rooms/${roomId}/messages`, {
          params: { page: pageParam, limit: 20 },
        });
        return data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
      enabled: !!roomId,
    });

  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data).reverse();
  }, [data]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId) return;
      const socket = getSocket();
      socket?.emit('send_message', { roomId, content });
    },
    [roomId]
  );

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (message: Message) => {
      if (message.roomId !== roomId) return;
      queryClient.setQueryData<{ pages: PaginatedResponse<Message>[]; pageParams: number[] }>(
        ['messages', roomId],
        (old) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          if (!firstPage) return old;
          return {
            ...old,
            pages: [{ ...firstPage, data: [message, ...firstPage.data] }, ...old.pages.slice(1)],
          };
        }
      );
    };

    socket.on('receive_message', handler);
    return () => { socket.off('receive_message', handler); };
  }, [roomId, queryClient]);

  return { messages, fetchNextPage, hasNextPage, isFetchingNextPage, sendMessage, isLoading };
}
