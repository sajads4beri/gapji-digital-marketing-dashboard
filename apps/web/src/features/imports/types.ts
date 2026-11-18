export type ImportDataType = 'leads' | 'costs';

export type ImportStep = 1 | 2 | 3 | 4;

export interface TargetFieldDef {
  key: string;
  label: string;
  labelFa: string;
  required: boolean;
  aliases: string[];
  description?: string;
  example?: string;
}

export interface InspectImportResult {
  headers: string[];
  previewRows: Record<string, string>[];
  rowCount: number;
  suggestedMappings: Record<string, string>;
  targetFields: TargetFieldDef[];
}

export interface RowValidationResult {
  rowNumber: number;
  originalData: Record<string, any>;
  normalizedData: Record<string, any>;
  status: 'valid' | 'invalid' | 'duplicate';
  errors: string[];
  warnings: string[];
  duplicateReason?: string;
}

export interface ValidateImportResult {
  dataType: ImportDataType;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  warningRowsCount: number;
  rows: RowValidationResult[];
}

export interface ExecuteImportPayload {
  dataType: ImportDataType;
  fileName: string;
  validRows: Record<string, any>[];
  idempotencyKey?: string;
  duplicateHandling?: 'skip';
  mapping?: Record<string, string>;
}

export interface ExecuteImportResult {
  importJobId: string;
  dataType: ImportDataType;
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; reason: string }>;
  status: 'completed' | 'partial' | 'failed';
}

export interface ImportJobHistoryItem {
  id: string;
  dataType: ImportDataType;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  createdByName: string;
}
