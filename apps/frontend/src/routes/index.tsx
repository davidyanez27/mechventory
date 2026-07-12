import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'

export const Route = createFileRoute('/')({

  beforeLoad: async () => {
    const signedIn = await getCurrentUser().then(
      () => true,
      () => false,
    )
    throw redirect({ to: signedIn ? '/dashboard' : '/login' })
  },
  component: IndexRedirect,
})

function IndexRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    getCurrentUser().then(
      () => navigate({ to: '/dashboard', replace: true }),
      () => navigate({ to: '/login', replace: true }),
    )
  }, [navigate])
  return null
}
