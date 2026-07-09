import { createFileRoute } from '@tanstack/react-router'
import { InvoicesPage } from '@/UI/pages/InvoicesPage'

export const Route = createFileRoute('/_app/invoices/')({
  component: InvoicesPage,
})
