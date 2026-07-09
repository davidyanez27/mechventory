import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentUser } from 'aws-amplify/auth'

export const Route = createFileRoute('/_auth')({
  // Guest guard: signed-in users skip the auth screens entirely.
  beforeLoad: async () => {
    const signedIn = await getCurrentUser().then(
      () => true,
      () => false,
    )
    if (signedIn) throw redirect({ to: '/dashboard' })
  },
  component: Outlet,
})
