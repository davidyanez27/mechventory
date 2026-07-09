import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/UI/pages/LoginPage'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})
