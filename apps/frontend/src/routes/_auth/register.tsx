import { createFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '@/UI/pages/RegisterPage'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})
