/**
 * Client-Side RFC 4180-compliant CSV Parser & Serializer
 * Zero external dependencies. Formula Injection protection.
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: string[][];
  rowCount: number;
  delimiter: string;
}

export class ClientCsvParser {
  public static stripBom(text: string): string {
    if (!text) return '';
    return text.replace(/^\uFEFF/, '');
  }

  public static detectDelimiter(sampleLine: string): string {
    const commas = (sampleLine.match(/,/g) || []).length;
    const semicolons = (sampleLine.match(/;/g) || []).length;
    const tabs = (sampleLine.match(/\t/g) || []).length;

    if (semicolons > commas && semicolons >= tabs) return ';';
    if (tabs > commas && tabs > semicolons) return '\t';
    return ',';
  }

  public static parse(text: string): ParsedCsvResult {
    const cleanText = this.stripBom(text || '').trim();
    if (!cleanText) {
      return { headers: [], rows: [], rowCount: 0, delimiter: ',' };
    }

    const firstLineEnd = cleanText.indexOf('\n');
    const firstLine = firstLineEnd !== -1 ? cleanText.substring(0, firstLineEnd) : cleanText;
    const delimiter = this.detectDelimiter(firstLine);

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    const len = cleanText.length;

    while (i < len) {
      const char = cleanText[i];
      const nextChar = i + 1 < len ? cleanText[i + 1] : '';

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (!inQuotes) {
        if (char === delimiter) {
          currentRow.push(currentField.trim());
          currentField = '';
          i++;
          continue;
        } else if (char === '\r') {
          if (nextChar === '\n') {
            i++;
          }
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
          i++;
          continue;
        } else if (char === '\n') {
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
          i++;
          continue;
        }
      }

      currentField += char;
      i++;
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length === 0) {
      return { headers: [], rows: [], rowCount: 0, delimiter };
    }

    const rawHeaders = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
    const dataRows = rows.slice(1);

    return {
      headers: rawHeaders,
      rows: dataRows,
      rowCount: dataRows.length,
      delimiter,
    };
  }

  public static sanitizeForCsv(value: any): string {
    if (value === null || value === undefined) return '';
    let str = String(value);
    const trimmed = str.trimStart();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      str = "'" + str;
    }
    if (/[",;\r\n]/.test(str)) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  public static stringify(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
    const BOM = '\uFEFF';
    const headerLine = headers.map((h) => this.sanitizeForCsv(h)).join(',');
    const rowLines = rows.map((row) => row.map((cell) => this.sanitizeForCsv(cell)).join(','));
    return BOM + [headerLine, ...rowLines].join('\r\n');
  }

  public static downloadCsv(fileName: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
