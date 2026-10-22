import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';

export function useOwnerAuth() {
  const { api } = useApp();
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['owner'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
    },
  });

  const registerOwner = useMutation({
    mutationFn: (businessName: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      return api.registerOwner(token, businessName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner'] });
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.clear();
  };

  const token = localStorage.getItem('token');

  return { login, registerOwner, logout, token, isAuthenticated: !!token };
}

export function useOwnerProfile(token?: string) {
  const { api } = useApp();
  return useQuery({
    queryKey: ['owner', token],
    queryFn: () => api.owner(token!),
    enabled: !!token,
  });
}

export function useOwnerProperties(token?: string) {
  const { api } = useApp();
  return useQuery({
    queryKey: ['properties', token],
    queryFn: () => api.myProperties(token!),
    enabled: !!token,
  });
}

export function useOwnerBookings(token?: string) {
  const { api } = useApp();
  return useQuery({
    queryKey: ['ownerBookings', token],
    queryFn: () => api.ownerBookings(token!),
    enabled: !!token,
  });
}

export function useCreateProperty(token: string) {
  const { api } = useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; city: string; address: string; type: string }) =>
      api.createProperty(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', token] });
    },
  });
}

export function useCreateUnit(token: string) {
  const { api } = useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: string; name: string; capacity: number; rate: number }) =>
      api.createUnit(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', token] });
    },
  });
}