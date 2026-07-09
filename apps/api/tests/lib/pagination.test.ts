import { describe, expect, test } from 'vitest';
import { toListResponse } from '../../src/lib/pagination.js';

// API_BASE_URL comes from .env.test (https://api.test).
describe('toListResponse', () => {
  test('should wrap the rows and pagination in the list envelope', () => {
    const rows = [{ name: 'Alpha' }, { name: 'Beta' }];

    const response = toListResponse('products', rows, {
      page: 1,
      limit: 10,
      total: 2,
      hasNext: false,
      hasPrev: false,
    });

    expect(response.data).toBe(rows);
    expect(response.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      next: null,
      prev: null,
    });
  });

  test('should build next and prev links from the resource name', () => {
    const response = toListResponse('customers', [], {
      page: 3,
      limit: 20,
      total: 100,
      hasNext: true,
      hasPrev: true,
    });

    expect(response.pagination.next).toBe('https://api.test/customers/findAll?page=4&limit=20');
    expect(response.pagination.prev).toBe('https://api.test/customers/findAll?page=2&limit=20');
  });

  test('should return null links at either end of the list', () => {
    const first = toListResponse('users', [], {
      page: 1,
      limit: 10,
      total: 30,
      hasNext: true,
      hasPrev: false,
    });
    const last = toListResponse('users', [], {
      page: 3,
      limit: 10,
      total: 30,
      hasNext: false,
      hasPrev: true,
    });

    expect(first.pagination.prev).toBeNull();
    expect(first.pagination.next).not.toBeNull();
    expect(last.pagination.next).toBeNull();
    expect(last.pagination.prev).not.toBeNull();
  });
});
