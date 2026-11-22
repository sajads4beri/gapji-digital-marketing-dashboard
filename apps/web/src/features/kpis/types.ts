export type MetricDirection = 'higher_is_better' | 'lower_is_better';

export interface CampaignSummary {
  id: string;
  name: string;
  status?: string;
}

export interface KpiItem {
  id: string;
  name: string;
  code: string;
  formula?: string;
  direction: MetricDirection;
  targetValue: number;
  actualValue: number;
  progressPercentage: number;
  unit: string;
  period: string;
  scope: 'organization' | 'campaign';
  scopeTitle: string;
  campaign?: CampaignSummary | null;
  alertRulesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKpiInput {
  name: string;
  code: string;
  campaignId?: string;
  targetValue: number;
  direction?: MetricDirection;
  unit: string;
  period: string;
  formula?: string;
}

export interface UpdateKpiInput {
  name?: string;
  code?: string;
  campaignId?: string;
  targetValue?: number;
  direction?: MetricDirection;
  unit?: string;
  period?: string;
  formula?: string;
}

export interface MetricDefinition {
  id?: string;
  code: string;
  name: string;
  formula: string;
  unit: string;
  direction: MetricDirection;
  description?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CreateCustomMetricInput {
  name: string;
  code: string;
  description?: string;
  formula: string;
  direction?: MetricDirection;
  unit?: string;
}

export interface ValidateFormulaInput {
  formula: string;
  campaignId?: string;
}

export interface ValidateFormulaResponse {
  isValid: boolean;
  error?: string;
  variables: string[];
  normalizedFormula?: string;
}

export interface PreviewFormulaResponse extends ValidateFormulaResponse {
  value: number;
  divisionByZero: boolean;
  campaignName: string;
  contextVariables: Record<string, number>;
}

export interface AlertRuleItem {
  id: string;
  organizationId: string;
  kpiMetricId?: string | null;
  kpiMetricName?: string | null;
  metricName: string;
  condition: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  thresholdValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction?: string | null;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRuleInput {
  kpiMetricId?: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  thresholdValue: number;
  severity?: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction?: string;
  isActive?: boolean;
}

export interface UpdateAlertRuleInput {
  kpiMetricId?: string;
  metricName?: string;
  condition?: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  thresholdValue?: number;
  severity?: 'info' | 'warning' | 'critical';
  message?: string;
  suggestedAction?: string;
  isActive?: boolean;
}
