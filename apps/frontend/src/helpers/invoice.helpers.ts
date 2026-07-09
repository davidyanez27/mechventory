import InventoryApi from "@/infrastructure/api/api-client"

// Issued invoices answer with a short-lived presigned S3 link; drafts are
// never stored in S3, so the API hands back the PDF bytes (base64) instead.
export async function openInvoicePdf(id: string): Promise<void> {
  const { data } = await InventoryApi.get<{ url?: string; pdf?: string }>(
    `/invoices/pdf/${id}`,
  )
  if (data.url) {
    window.open(data.url, "_blank")
    return
  }
  const bytes = Uint8Array.from(atob(data.pdf ?? ""), (c) => c.charCodeAt(0))
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }))
  window.open(blobUrl, "_blank")
  // Release the blob once the new tab has had time to load it.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}
