import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ColumnDef } from '@/UI/components/information';
import { DataTable } from '@/UI/components/information';

interface Row {
  id: number;
  name: string;
}

const columns: ColumnDef<Row>[] = [{ key: 'name', header: 'Name', cell: (r) => r.name }];
const rows: Row[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
];

afterEach(() => {
  cleanup();
});

describe('DataTable', () => {
  test('should render a cell for every row', () => {
    render(<DataTable columns={columns} rows={rows} />);

    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
  });

  test('should show the error message when loading failed', () => {
    render(<DataTable columns={columns} rows={[]} isError />);

    expect(screen.getByText(/Failed to load data/)).toBeDefined();
  });

  test('should show the custom empty message when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="Nothing here" />);

    expect(screen.getByText('Nothing here')).toBeDefined();
  });

  test('should render the translated footer when there is more than one page', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        pagination={{ page: 1, limit: 1, total: 3, next: null, prev: null }}
      />,
    );

    expect(screen.getByText('Page 1 of 3 · 3 total')).toBeDefined();
  });

  test('should ask for the next page when Next is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        pagination={{ page: 1, limit: 1, total: 3, next: null, prev: null }}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByText('Next'));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test('should hide the footer when everything fits on one page', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        pagination={{ page: 1, limit: 20, total: 2, next: null, prev: null }}
      />,
    );

    expect(screen.queryByText('Next')).toBeNull();
  });
});
