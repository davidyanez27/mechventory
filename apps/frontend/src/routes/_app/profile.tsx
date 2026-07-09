import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/UI/pages/ProfilePage'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})
