import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Hub } from 'aws-amplify/utils'
import { getCurrentUser } from 'aws-amplify/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // A Hosted-UI (Google) login returns to `/?code=...`. Amplify needs a beat to
    // exchange that code for a session, so while a code is present we DON'T redirect
    // — the component waits for the exchange to finish, then routes into the app.
    // Redirecting here (on a not-yet-established session) is what stranded users on
    // a blank page.
    if (new URLSearchParams(window.location.search).has('code')) return

    // Normal visit to `/`: bounce straight to the right place.
    const signedIn = await getCurrentUser().then(
      () => true,
      () => false,
    )
    throw redirect({ to: signedIn ? '/dashboard' : '/login' })
  },
  component: OAuthLanding,
})

// Reached for the OAuth callback (`/?code=...`). Amplify processes the code in the
// background and fires a `signedIn` Hub event when the session exists; we wait for
// that (or a failure) instead of rendering a blank page.
function OAuthLanding() {
  const navigate = useNavigate()

  useEffect(() => {
    const toDashboard = () => navigate({ to: '/dashboard', replace: true })
    const toLogin = () => navigate({ to: '/login', replace: true })

    // Amplify may have already finished exchanging the code before we mounted.
    getCurrentUser().then(toDashboard, () => {})

    const stop = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') toDashboard()
      else if (payload.event === 'signInWithRedirect_failure') toLogin()
    })
    return stop
  }, [navigate])

  return null
}
