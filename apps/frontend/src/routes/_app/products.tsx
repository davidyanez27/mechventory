import { createFileRoute } from '@tanstack/react-router'
import { ProductsPage } from '@/UI/pages/ProductsPage'

export const Route = createFileRoute('/_app/products')({
  component: ProductsPage,
})
