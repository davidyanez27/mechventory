import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import InventoryApi from '@/infrastructure/api/api-client';
import { openInvoicePdf } from '@/helpers/invoice.helpers';

// The only outward edge is the API client; everything else is DOM plumbing.
// vitest hoists this above the imports regardless of where it sits.
vi.mock('@/infrastructure/api/api-client', () => ({
  default: { get: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom ships neither of these Blob helpers, so provide stubs to observe.
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('openInvoicePdf', () => {
  test('should open the presigned link directly for an issued invoice', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(InventoryApi.get).mockResolvedValue({ data: { url: 'https://signed.example/pdf' } });

    await openInvoicePdf('inv-issued');

    expect(open).toHaveBeenCalledWith('https://signed.example/pdf', '_blank');
    // No S3 link means no local blob — the base64 branch must stay untouched.
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  test('should turn a base64 draft into a blob URL and open it', async () => {
    vi.useFakeTimers();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(InventoryApi.get).mockResolvedValue({ data: { pdf: btoa('PDF-BYTES') } });

    await openInvoicePdf('inv-draft');

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('blob:mock-url', '_blank');

    // The blob is released on a delayed timer, not synchronously.
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
