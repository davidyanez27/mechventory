export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(
  dateStr: string,
  monthStyle: "short" | "long" = "short",
  locale?: string,
): string {
  return new Date(dateStr).toLocaleDateString(locale ?? "en-US", {
    year: "numeric",
    month: monthStyle,
    day: "numeric",
  })
}
