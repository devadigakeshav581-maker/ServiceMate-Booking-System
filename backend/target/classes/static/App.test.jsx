import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AuthAPI } from './api';

// 1. Create a hoisted mock for navigation
const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

// 2. Mock react-router-dom but keep the actual Router components
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the API module to prevent actual network calls
vi.mock('./api', () => ({
  getToken: () => null, // Simulate logged out state
  AuthAPI: {
    login: vi.fn(),
  },
  // Mock other exports used in components
  BookingAPI: {},
  PaymentAPI: {},
  ServiceAPI: {},
  AdminAPI: {},
}));

describe('App Component', () => {
  it('renders the login page by default', () => {
    render(<App />);
    // Check for text specific to the Login component
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
  });

  // Clear mocks before each test to ensure clean state
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits login form with credentials', async () => {
    const user = userEvent.setup();
    // Mock successful login response
    AuthAPI.login.mockResolvedValue('fake-jwt-token');

    render(<App />);

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitBtn);

    expect(AuthAPI.login).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      password: 'password123',
      role: 'CUSTOMER'
    }));

    // 3. Verify redirection to the correct dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/customer-dashboard');
  });

  it('redirects to provider dashboard when PROVIDER role is selected', async () => {
    const user = userEvent.setup();
    AuthAPI.login.mockResolvedValue('fake-jwt-token');

    render(<App />);

    // Select Provider role
    const providerRoleBtn = screen.getByText('PROVIDER');
    await user.click(providerRoleBtn);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'provider@test.com');
    await user.type(screen.getByPlaceholderText(/Enter your password/i), 'pass123');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(AuthAPI.login).toHaveBeenCalledWith(expect.objectContaining({
      email: 'provider@test.com',
      password: 'pass123',
      role: 'PROVIDER'
    }));

    expect(mockNavigate).toHaveBeenCalledWith('/provider-dashboard');
  });

  it('displays error message when login fails', async () => {
    const user = userEvent.setup();
    // Mock failed login response
    AuthAPI.login.mockRejectedValue(new Error('Unauthorized'));

    render(<App />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText(/Enter your password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    // Check for specific error message set in Login.jsx
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });
});