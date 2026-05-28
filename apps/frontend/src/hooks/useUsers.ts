import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface SearchUser {
  id: string;
  username: string;
  email: string;
}

export function useUsers(query: string) {
  const { data: users = [], isLoading } = useQuery<SearchUser[]>({
    queryKey: ['users', 'search', query],
    queryFn: async () => {
      const { data } = await api.get('/users/search', { params: { q: query } });
      return data;
    },
    enabled: query.length >= 2,
  });

  return { users, isLoading };
}
