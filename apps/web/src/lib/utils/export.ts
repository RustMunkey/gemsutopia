import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ExportOptions {
  filename: string;
  title?: string;
  columns: { header: string; key: string; width?: number }[];
  data: Record<string, unknown>[];
  format: ExportFormat;
}

/**
 * Generate CSV content from data
 */
export function generateCSV(
  columns: { header: string; key: string; width?: number }[],
  data: Record<string, unknown>[]
): string {
  const headers = columns.map(col => `"${col.header}"`).join(',');
  const rows = data.map(row =>
    columns
      .map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Generate XLSX buffer from data
 */
export function generateXLSX(
  columns: { header: string; key: string; width?: number }[],
  data: Record<string, unknown>[],
  sheetName: string = 'Sheet1'
): Buffer {
  // Create worksheet data with headers
  const wsData = [
    columns.map(col => col.header),
    ...data.map(row => columns.map(col => row[col.key] ?? '')),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

/**
 * Generate PDF buffer from data
 */
export function generatePDF(
  columns: { header: string; key: string; width?: number }[],
  data: Record<string, unknown>[],
  title: string,
  filename: string
): Buffer {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  // Add table
  autoTable(doc, {
    startY: 40,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => String(row[col.key] ?? ''))),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Export data to the specified format and return Response
 */
export function exportData(options: ExportOptions): Response {
  const { filename, title, columns, data, format } = options;

  switch (format) {
    case 'csv': {
      const csv = generateCSV(columns, data);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    case 'xlsx': {
      const xlsx = generateXLSX(columns, data, title || 'Data');
      return new Response(new Uint8Array(xlsx), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    case 'pdf': {
      const pdf = generatePDF(columns, data, title || filename, filename);
      return new Response(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Format currency for export
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}

/**
 * Format date for export
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
}

/**
 * Format datetime for export
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.toLocaleDateString('en-CA')} ${d.toLocaleTimeString('en-CA', { hour12: false })}`;
}
