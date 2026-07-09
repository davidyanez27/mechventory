import { createFileRoute } from '@tanstack/react-router'
import { InvoicePage } from '@/UI/pages/InvoicePage'

export const Route = createFileRoute('/_app/invoices/$invoiceId/edit')({
  component: () => {
    const { invoiceId } = Route.useParams()
    return <InvoicePage invoiceId={invoiceId} />
  },
})
