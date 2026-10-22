import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';

// Make expect available globally
global.expect = expect;

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:4000/api/v1',
  },
  writable: true,
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
    clear: vi.fn(),
  }),
  QueryClient: vi.fn().mockImplementation(() => ({
    invalidateQueries: vi.fn(),
    clear: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));