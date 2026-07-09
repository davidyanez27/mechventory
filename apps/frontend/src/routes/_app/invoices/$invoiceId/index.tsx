import { createFileRoute } from '@tanstack/react-router'
import { InvoiceViewPage } from '@/UI/pages/InvoiceViewPage'

export const Route = createFileRoute('/_app/invoices/$invoiceId/')({
  component: () => {
    const { invoiceId } = Route.useParams()
    return <InvoiceViewPage invoiceId={invoiceId} />
  },
})
