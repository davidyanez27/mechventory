import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUser } from 'aws-amplify/auth'
import { AppLayout } from '@/UI/layouts'

export const Route = createFileRoute('/_app')({
  // Auth guard: getCurrentUser() throws when nobody is signed in.
  beforeLoad: async () => {
    try {
      await getCurrentUser()
    } catch {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})
