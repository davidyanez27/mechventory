import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { awaitOAuthOutcome } from '@/lib/amplify'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Hosted-UI (Google) returns to `/?code=...`; Amplify exchanges that code for
    // a session in the background. Redirecting here — or in the component before
    // the exchange finishes — cancels it and strands the user on a blank page. So
    // while a code is present we don't redirect; the component waits for the
    // exchange outcome instead.
    if (new URLSearchParams(window.location.search).has('code')) return

    const signedIn = await getCurrentUser().then(
      () => true,
      () => false,
    )
    throw redirect({ to: signedIn ? '/dashboard' : '/login' })
  },
  component: OAuthLanding,
})

// Reached for the OAuth callback (`/?code=...`). Amplify reports the code→token
// exchange result through a Hub event captured in `lib/amplify` — react to it
// deterministically rather than polling `getCurrentUser` blind (polling can't tell
// "still exchanging" from "failed", which is what left users on a blank page).
function OAuthLanding() {
  const navigate = useNavigate()

  useEffect(() => {
    let done = false
    const go = (to: '/dashboard' | '/login') => {
      if (done) return
      done = true
      navigate({ to, replace: true })
    }

    // Success → dashboard. Failure → login, surfacing the real reason (also
    // already logged to the console by the Hub listener).
    void awaitOAuthOutcome().then((outcome) => {
      if (outcome === 'success') return go('/dashboard')
      sessionStorage.setItem('oauth_error', outcome.error)
      go('/login')
    })

    // Belt and suspenders: tokens may already be cached if we mounted after the
    // exchange completed.
    void getCurrentUser().then(() => go('/dashboard')).catch(() => {})

    // If the exchange never started (no in-flight flag) Amplify emits no event at
    // all, so time out to the login screen rather than hang forever.
    const timeout = setTimeout(() => {
      console.warn('[oauth] no sign-in result after 8s; returning to login')
      go('/login')
    }, 8000)

    return () => {
      done = true
      clearTimeout(timeout)
    }
  }, [navigate])

  return null
}
