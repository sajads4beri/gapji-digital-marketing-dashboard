/**
 * Pure TypeScript RFC 4180-compliant CSV Parser & Serializer
 * Zero external dependencies. Safe against Formula Injection (CSV Injection).
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: string[][];
  rowCount: number;
  delimiter: string;
}

export class CsvParser {
  /**
   * Cleans UTF-8 BOM if present
   */
  public static stripBom(text: string): string {
    if (!text) return '';
    return text.replace(/^\uFEFF/, '');
  }

  /**
   * Auto-detects delimiter: comma (,), semicolon (;), or tab (\t)
   */
  public static detectDelimiter(sampleLine: string): string {
    const commas = (sampleLine.match(/,/g) || []).length;
    const semicolons = (sampleLine.match(/;/g) || []).length;
    const tabs = (sampleLine.match(/\t/g) || []).length;

    if (semicolons > commas && semicolons >= tabs) return ';';
    if (tabs > commas && tabs > semicolons) return '\t';
    return ',';
  }

  /**
   * Parses CSV text into headers and row matrix respecting RFC 4180
   */
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
          // Escaped quote: "" inside quotes becomes "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote mode
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
            i++; // skip \r of \r\n
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

    // Flush last field and row
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

  /**
   * Protects against CSV / Formula Injection by prefixing risky characters (=, +, -, @, \t, \r) with a single quote
   */
  public static sanitizeForCsv(value: any): string {
    if (value === null || value === undefined) return '';
    let str = String(value);
    const trimmed = str.trimStart();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      str = "'" + str;
    }
    // Quote string if it contains commas, semicolons, quotes, or newlines
    if (/[",;\r\n]/.test(str)) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Generates CSV text with UTF-8 BOM
   */
  public static stringify(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
    const BOM = '\uFEFF';
    const headerLine = headers.map((h) => this.sanitizeForCsv(h)).join(',');
    const rowLines = rows.map((row) => row.map((cell) => this.sanitizeForCsv(cell)).join(','));
    return BOM + [headerLine, ...rowLines].join('\r\n');
  }
}
