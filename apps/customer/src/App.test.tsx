import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

// Mock the API client - use a constructor function
vi.mock('@patana/api-client', () => ({
  PatanaApi: function MockPatanaApi() {
    this.stays = vi.fn().mockResolvedValue([]);
    this.login = vi.fn().mockResolvedValue({ accessToken: 'token', tokenType: 'Bearer' });
    this.register = vi.fn().mockResolvedValue({ accessToken: 'token', tokenType: 'Bearer' });
    this.book = vi.fn().mockResolvedValue({});
    this.myBookings = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false, isError: false }),
  useMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
    clear: vi.fn(),
  }),
  QueryClient: function MockQueryClient() {
    this.invalidateQueries = vi.fn();
    this.clear = vi.fn();
  },
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Customer App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Stay somewhere you/i)).toBeInTheDocument();
  });

  it('shows auth form when not signed in', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
});