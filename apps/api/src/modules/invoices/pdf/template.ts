import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Company } from '@serveless/shared/company';
import type { Customer } from '@serveless/shared/customer';
import type { Invoice } from '@serveless/shared/invoice';

// Port of Backend-main's GeneralInvoicetemplate. One deliberate fix: tax and
// discount are flat amounts here (total = subtotal + tax - discount), so they
// are printed as-is — the original did percentage math that wouldn't add up
// to the stored total.
const money = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

export const buildInvoiceDocument = (
  invoice: Invoice,
  customer: Customer,
  company: Company,
): TDocumentDefinitions => {
  const currency = invoice.currency;
  const balance = invoice.total - invoice.amountPaid;

  const itemRows: TableCell[][] = invoice.items.map((item) => [
    { text: String(item.quantity), alignment: 'center', fontSize: 9 },
    { text: item.description, fontSize: 9 },
    { text: money(item.unitPrice, currency), alignment: 'right', fontSize: 9 },
    {
      text: item.discount > 0 ? money(item.discount, currency) : '—',
      alignment: 'right',
      fontSize: 9,
    },
    { text: money(item.lineTotal, currency), alignment: 'right', fontSize: 9 },
  ]);

  const headerCell = (text: string, alignment: 'left' | 'center' | 'right'): TableCell => ({
    text,
    bold: true,
    fontSize: 9,
    alignment,
    color: '#ffffff',
    fillColor: '#333333',
  });

  return {
    pageSize: 'LETTER',
    pageMargins: [40, 40, 40, 40],

    content: [
      // ====== HEADER (company block left, red invoice band right) ======
      {
        columns: [
          {
            width: '*',
            stack: [
              // pdfmake only renders base64 data URLs here — a plain https
              // URL would crash the whole render.
              ...(company.logo?.startsWith('data:')
                ? [{ image: company.logo, width: 80, margin: [0, 0, 0, 4] } as Content]
                : []),
              { text: company.name, bold: true, fontSize: 10, margin: [0, 0, 0, 2] },
              { text: `${company.idType}: ${company.idValue}`, fontSize: 8 },
              { text: company.address, fontSize: 8 },
              { text: company.email, fontSize: 8 },
              { text: company.phone, fontSize: 8 },
            ],
          },
          {
            width: 200,
            stack: [
              {
                table: {
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: 'INVOICE',
                        alignment: 'right',
                        bold: true,
                        fontSize: 14,
                        margin: [4, 6, 4, 2],
                        color: '#ffffff',
                      },
                    ],
                  ],
                },
                fillColor: '#E54545',
                layout: 'noBorders',
              },
              {
                table: {
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: `# ${invoice.number}`,
                        alignment: 'right',
                        fontSize: 9,
                        margin: [4, 2, 4, 0],
                        color: '#ffffff',
                      },
                    ],
                  ],
                },
                fillColor: '#E54545',
                layout: 'noBorders',
                margin: [0, -2, 0, 6],
              },
              {
                table: {
                  widths: ['auto', '*'],
                  body: [
                    [
                      { text: 'Issue date:', fontSize: 8, bold: true },
                      {
                        text: new Date(invoice.issueDate).toLocaleDateString(),
                        fontSize: 8,
                        alignment: 'right',
                      },
                    ],
                    ...(invoice.dueDate
                      ? [
                          [
                            { text: 'Due date:', fontSize: 8, bold: true },
                            {
                              text: new Date(invoice.dueDate).toLocaleDateString(),
                              fontSize: 8,
                              alignment: 'right',
                            },
                          ] as TableCell[],
                        ]
                      : []),
                    [
                      { text: 'Status:', fontSize: 8, bold: true },
                      {
                        text: invoice.status.replace('_', ' '),
                        fontSize: 8,
                        alignment: 'right',
                        bold: true,
                      },
                    ],
                  ],
                },
                layout: { hLineWidth: () => 0.7, vLineWidth: () => 0 },
                margin: [0, 4, 0, 0],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 12],
      } as Content,

      // Horizontal rule under the header.
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
        margin: [0, 0, 0, 6],
      },

      // ====== CLIENT INFO ======
      {
        table: {
          widths: [60, '*', 30, '*'],
          body: [
            [
              { text: 'BILL TO:', bold: true, fontSize: 8 },
              { text: customer.name, fontSize: 8 },
              { text: 'ID:', bold: true, fontSize: 8 },
              {
                text: `${customer.identifier.type}: ${customer.identifier.value}`,
                fontSize: 8,
              },
            ],
            [
              { text: 'ADDRESS:', bold: true, fontSize: 8 },
              { text: customer.billingAddress, fontSize: 8, colSpan: 3 },
              {},
              {},
            ],
            [
              { text: 'EMAIL:', bold: true, fontSize: 8 },
              { text: customer.email ?? 'N/A', fontSize: 8, colSpan: 3 },
              {},
              {},
            ],
          ],
        },
        layout: { hLineWidth: () => 0.7, vLineWidth: () => 0 },
        margin: [0, 0, 0, 10],
      },

      // ====== ITEMS TABLE ======
      {
        table: {
          headerRows: 1,
          widths: [40, '*', 80, 70, 80],
          body: [
            [
              headerCell('Qty', 'center'),
              headerCell('Description', 'left'),
              headerCell('Unit price', 'right'),
              headerCell('Discount', 'right'),
              headerCell('Amount', 'right'),
            ],
            ...itemRows,
          ],
        },
        layout: { hLineWidth: () => 0.7, vLineWidth: () => 0.7 },
        margin: [0, 0, 0, 10],
      },

      // ====== BOTTOM: notes + payment method | totals ======
      {
        table: {
          widths: ['*', 200],
          body: [
            [
              {
                margin: [4, 4, 4, 4],
                stack: [
                  ...(invoice.notes
                    ? [
                        { text: 'Notes:', bold: true, fontSize: 8, margin: [0, 0, 0, 4] },
                        { text: invoice.notes, fontSize: 8, margin: [0, 0, 0, 10] },
                      ]
                    : []),
                  {
                    text: 'Payment method:',
                    bold: true,
                    fontSize: 8,
                    margin: [0, 0, 0, 2],
                  },
                  { text: invoice.paymentMethod.replace('_', ' '), fontSize: 8 },
                ],
              } as TableCell,
              {
                margin: [4, 4, 4, 4],
                stack: [
                  {
                    table: {
                      widths: ['*', 'auto'],
                      body: [
                        [
                          { text: 'Subtotal', fontSize: 8 },
                          {
                            text: money(invoice.subtotal, currency),
                            alignment: 'right',
                            fontSize: 8,
                          },
                        ],
                        ...(invoice.tax > 0
                          ? [
                              [
                                { text: 'Tax', fontSize: 8 },
                                {
                                  text: `+ ${money(invoice.tax, currency)}`,
                                  alignment: 'right',
                                  fontSize: 8,
                                },
                              ] as TableCell[],
                            ]
                          : []),
                        ...(invoice.discount > 0
                          ? [
                              [
                                { text: 'Discount', fontSize: 8 },
                                {
                                  text: `- ${money(invoice.discount, currency)}`,
                                  alignment: 'right',
                                  fontSize: 8,
                                },
                              ] as TableCell[],
                            ]
                          : []),
                      ],
                    },
                    layout: 'noBorders',
                  },
                  {
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 188, y2: 0, lineWidth: 0.7 }],
                    margin: [0, 4, 0, 2],
                  },
                  {
                    columns: [
                      { text: 'TOTAL', bold: true, fontSize: 9, alignment: 'left' },
                      {
                        text: money(invoice.total, currency),
                        bold: true,
                        fontSize: 9,
                        alignment: 'right',
                      },
                    ],
                  },
                  ...(invoice.amountPaid > 0
                    ? [
                        {
                          columns: [
                            {
                              text: 'Amount paid',
                              fontSize: 8,
                              alignment: 'left',
                              margin: [0, 4, 0, 0],
                            },
                            {
                              text: money(invoice.amountPaid, currency),
                              fontSize: 8,
                              alignment: 'right',
                              margin: [0, 4, 0, 0],
                            },
                          ],
                        } as Content,
                        {
                          columns: [
                            {
                              text: 'Balance due',
                              bold: true,
                              fontSize: 9,
                              alignment: 'left',
                              margin: [0, 2, 0, 0],
                            },
                            {
                              text: money(balance, currency),
                              bold: true,
                              fontSize: 9,
                              alignment: 'right',
                              margin: [0, 2, 0, 0],
                            },
                          ],
                        } as Content,
                      ]
                    : []),
                ],
              } as TableCell,
            ],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 8],
      },
    ] as Content[],

    defaultStyle: {
      fontSize: 9,
      lineHeight: 1.1,
    },
  };
};
