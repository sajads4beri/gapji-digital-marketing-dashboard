import { CurrentUserPayload } from '../dto/current-user-payload.interface';

export interface TargetFieldDef {
  key: string;
  label: string;
  labelFa: string;
  required: boolean;
  aliases: string[];
  description?: string;
  example?: string;
}

export interface FieldResolutionContext {
  organizationId: string;
  campaigns: Map<string, string>; // normalized name/id -> campaignId
  campaignNames: Map<string, string>; // campaignId -> original name
  leadStatuses?: Map<string, any>; // normalized key/label -> LeadStatusConfig
  defaultLeadStatus?: any;
  assignees?: Map<string, string>; // normalized email/name/id -> userId
  costCategories?: Set<string>;
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

export interface BatchPersistResult {
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface ImportAdapter {
  readonly dataType: 'leads' | 'costs';
  getTargetFields(): TargetFieldDef[];
  getSampleTemplate(): { headers: string[]; rows: string[][] };
  assertAccess(user: CurrentUserPayload): void;
  loadResolutionContext(organizationId: string, user: CurrentUserPayload): Promise<FieldResolutionContext>;
  validateRow(
    row: Record<string, any>,
    rowNumber: number,
    context: FieldResolutionContext,
    user: CurrentUserPayload,
    seenBatchKeys: Set<string>,
  ): Promise<RowValidationResult>;
  persistBatch(
    validRows: any[],
    organizationId: string,
    user: CurrentUserPayload,
    importJobId: string,
  ): Promise<BatchPersistResult>;
}
