import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

// Mock the API client - use a constructor function
vi.mock('@patana/api-client', () => ({
  PatanaApi: function MockPatanaApi() {
    this.login = vi.fn().mockResolvedValue({ accessToken: 'token', tokenType: 'Bearer' });
    this.registerOwner = vi.fn().mockResolvedValue({});
    this.owner = vi.fn().mockResolvedValue({ businessName: 'Test Business', verificationStatus: 'verified' });
    this.myProperties = vi.fn().mockResolvedValue([]);
    this.createProperty = vi.fn().mockResolvedValue({});
    this.createUnit = vi.fn().mockResolvedValue({});
    this.ownerBookings = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false, isError: false }),
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

describe('Owner App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Your place. Your business.')).toBeInTheDocument();
  });

  it('shows sign in form when not authenticated', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
});