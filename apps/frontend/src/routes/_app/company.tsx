import { createFileRoute } from '@tanstack/react-router'
import { CompanyPage } from '@/UI/pages/CompanyPage'

export const Route = createFileRoute('/_app/company')({
  component: CompanyPage,
})
