import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Hosted-UI (Google) returns to `/?code=...`; Amplify exchanges that code for
    // a session in the background. Redirecting here — or in the component before
    // the exchange finishes — cancels it and strands the user on a blank page. So
    // while a code is present we don't redirect; the component waits for the
    // session to appear.
    if (new URLSearchParams(window.location.search).has('code')) return

    const signedIn = await getCurrentUser().then(
      () => true,
      () => false,
    )
    throw redirect({ to: signedIn ? '/dashboard' : '/login' })
  },
  component: OAuthLanding,
})

// Reached for the OAuth callback (`/?code=...`). Poll for the session Amplify is
// establishing in the background rather than deciding once and navigating away
// early — leaving the page is what was cancelling the code→token exchange.
function OAuthLanding() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    let tries = 0

    const poll = async () => {
      const signedIn = await getCurrentUser().then(
        () => true,
        () => false,
      )
      if (cancelled) return
      if (signedIn) {
        navigate({ to: '/dashboard', replace: true })
      } else if (tries++ > 25) {
        // ~5s guard: exchange never completed, fall back to the login screen.
        navigate({ to: '/login', replace: true })
      } else {
        setTimeout(poll, 200)
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return null
}
