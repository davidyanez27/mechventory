import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ListUsers, User } from '@serveless/shared/user';
import { CompanyPage } from '@/UI/pages/CompanyPage';

// The page is driven entirely by these two hooks plus the toast bus; mocking
// them keeps the test on the component's own branching (roles, disabled rules,
// the invite form) with no network or auth in play.
const invite = vi.fn(() => Promise.resolve({ message: 'ok' }));
const remove = vi.fn(() => Promise.resolve({ message: 'ok' }));

const authState = vi.hoisted(() => ({
  me: {
    uuid: 'admin-uuid',
    company: { uuid: 'co-uuid', name: 'Test Workshop', role: 'ADMIN' },
  },
}));

const membersState = vi.hoisted(() => ({
  data: undefined as ListUsers | undefined,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: authState.me }),
}));

vi.mock('@/hooks/useCompanyMembers', () => ({
  useCompanyMembers: () => ({
    data: membersState.data,
    isLoading: false,
    isError: false,
    invite,
    remove,
    isInviting: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const member = (over: Partial<User>): User => ({
  uuid: 'x',
  fullName: 'Name',
  email: 'name@example.com',
  companyRole: 'MEMBER',
  isActive: true,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...over,
});

const seedMembers = () => {
  membersState.data = {
    data: [
      member({ uuid: 'owner-uuid', fullName: 'Olivia Owner', companyRole: 'OWNER' }),
      member({ uuid: 'admin-uuid', fullName: 'Adam Admin', companyRole: 'ADMIN' }),
      member({ uuid: 'mem-uuid', fullName: 'Mel Member', companyRole: 'MEMBER' }),
    ],
    pagination: { page: 1, limit: 20, total: 3, next: null, prev: null },
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  authState.me.uuid = 'admin-uuid';
  authState.me.company.role = 'ADMIN';
  seedMembers();
});

afterEach(() => {
  cleanup();
});

describe('CompanyPage', () => {
  test('should render a row for every member', () => {
    render(<CompanyPage />);

    expect(screen.getByText('Olivia Owner')).toBeDefined();
    expect(screen.getByText('Adam Admin')).toBeDefined();
    expect(screen.getByText('Mel Member')).toBeDefined();
  });

  test('should hide the invite button from a plain member', () => {
    authState.me.uuid = 'mem-uuid';
    authState.me.company.role = 'MEMBER';

    render(<CompanyPage />);

    expect(screen.queryByRole('button', { name: /Invite Member/i })).toBeNull();
  });

  test('should invite with the trimmed form values', async () => {
    render(<CompanyPage />);

    fireEvent.click(screen.getByRole('button', { name: /Invite Member/i }));
    fireEvent.change(screen.getByPlaceholderText('Jane Doe'), {
      target: { value: '  Jane Doe  ' },
    });
    fireEvent.change(screen.getByPlaceholderText('jane@company.com'), {
      target: { value: '  jane@company.com  ' },
    });

    // Header button + modal submit both read "Invite Member"; the submit is last.
    const buttons = screen.getAllByRole('button', { name: /Invite Member/i });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() =>
      expect(invite).toHaveBeenCalledWith({
        fullName: 'Jane Doe',
        email: 'jane@company.com',
        role: 'MEMBER',
      }),
    );
  });

  test('should not allow removing the owner or yourself', () => {
    render(<CompanyPage />);

    expect(screen.getByTitle<HTMLButtonElement>('The owner cannot be removed').disabled).toBe(true);
    expect(screen.getByTitle<HTMLButtonElement>('You cannot remove yourself').disabled).toBe(true);
    expect(screen.getByTitle<HTMLButtonElement>('Remove member').disabled).toBe(false);
  });
});
