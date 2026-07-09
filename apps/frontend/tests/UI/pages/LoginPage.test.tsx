import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LoginPage } from '@/UI/pages/LoginPage';

// Shared spies the mocks close over, so the test can assert on them.
const { navigate, login, completeNewPassword } = vi.hoisted(() => ({
  navigate: vi.fn(() => Promise.resolve()),
  login: vi.fn(),
  completeNewPassword: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('@/hooks', () => ({
  useAuth: () => ({
    login,
    isLoggingIn: false,
    loginWithProvider: vi.fn(),
    isProviderLoading: false,
    completeNewPassword,
    isSettingNewPassword: false,
  }),
}));

const signIn = () => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@test.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('Login', () => {
  test('should navigate to the dashboard on a completed sign-in', async () => {
    login.mockResolvedValue({ isSignedIn: true, nextStep: { signInStep: 'DONE' } });

    render(<LoginPage />);
    signIn();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/dashboard' }));
    expect(login).toHaveBeenCalledWith({ email: 'user@test.com', password: 'secret1' });
  });

  test('should surface the set-password step for an invited user', async () => {
    login.mockResolvedValue({
      isSignedIn: false,
      nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' },
    });

    render(<LoginPage />);
    signIn();

    expect(await screen.findByText('Set a new password')).toBeDefined();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('should reject a mismatched new password and complete a matching one', async () => {
    login.mockResolvedValue({
      isSignedIn: false,
      nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' },
    });
    completeNewPassword.mockResolvedValue({ isSignedIn: true });

    render(<LoginPage />);
    signIn();
    await screen.findByText('Set a new password');

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set password & sign in' }));

    expect(await screen.findByText('Passwords do not match.')).toBeDefined();
    expect(completeNewPassword).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set password & sign in' }));

    await waitFor(() => expect(completeNewPassword).toHaveBeenCalledWith('longenough1'));
  });
});
