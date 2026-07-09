import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/UI/pages/DashboardPage'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})
