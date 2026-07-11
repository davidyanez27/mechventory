import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentUser } from 'aws-amplify/auth'
import { LanguageSwitcher, ThemeToggle } from '@/UI/components/interaction'

// The auth screens have no AppHeader, so surface the language + theme controls
// here in a fixed corner. z-10 keeps them above the AuthBackdrop (z-0) and the
// card (z-1); they show on login, register and the confirm-code screen.
function AuthShell() {
  return (
    <>
      <div className="fixed right-4 top-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle isHeader={true} />
      </div>
      <Outlet />
    </>
  )
}

export const Route = createFileRoute('/_auth')({
  // Guest guard: signed-in users skip the auth screens entirely.
  beforeLoad: async () => {
    const signedIn = await getCurrentUser().then(
      () => true,
      () => false,
    )
    if (signedIn) throw redirect({ to: '/dashboard' })
  },
  component: AuthShell,
})
