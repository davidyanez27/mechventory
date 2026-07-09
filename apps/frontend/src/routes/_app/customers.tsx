import { createFileRoute } from '@tanstack/react-router'
import { CustomersPage } from '@/UI/pages/CustomersPage'

export const Route = createFileRoute('/_app/customers')({
  component: CustomersPage,
})
