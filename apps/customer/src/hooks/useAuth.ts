import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import type { Stay } from '@patana/types';

export function useAuth() {
  const { api } = useApp();
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const register = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) => api.register(name, email, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.clear();
  };

  const token = localStorage.getItem('token');

  return { login, register, logout, token, isAuthenticated: !!token };
}

export function useStays(city?: string) {
  const { api } = useApp();
  return useQuery({
    queryKey: ['stays', city],
    queryFn: () => api.stays(city),
    enabled: !!city,
  });
}

export function useTrips(token?: string) {
  const { api } = useApp();
  return useQuery({
    queryKey: ['trips', token],
    queryFn: () => api.myBookings(token!),
    enabled: !!token,
  });
}

export function useStaySearch() {
  const { api } = useApp();
  return useMutation({
    mutationFn: (city: string) => api.stays(city),
  });
}

export function useBooking() {
  const { api } = useApp();
  const token = localStorage.getItem('token');

  return useMutation({
    mutationFn: (booking: { unitId: string; checkIn: string; checkOut: string; guests: number }) =>
      token ? api.book(token, booking) : Promise.reject(new Error('Not authenticated')),
  });
}