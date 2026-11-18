import { api } from '@/lib/api';
import {
  KpiItem,
  CreateKpiInput,
  UpdateKpiInput,
  MetricDefinition,
  CreateCustomMetricInput,
  ValidateFormulaInput,
  ValidateFormulaResponse,
  PreviewFormulaResponse,
  AlertRuleItem,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
} from './types';

export const kpisApi = {
  // --- Tab 1: KPIs ---
  async getAllKpis(): Promise<KpiItem[]> {
    const response = await api.get<KpiItem[]>('/kpis');
    return response.data;
  },

  async getKpiById(id: string): Promise<KpiItem> {
    const response = await api.get<KpiItem>(`/kpis/${id}`);
    return response.data;
  },

  async createKpi(data: CreateKpiInput): Promise<KpiItem> {
    const response = await api.post<KpiItem>('/kpis', data);
    return response.data;
  },

  async updateKpi(id: string, data: UpdateKpiInput): Promise<KpiItem> {
    const response = await api.patch<KpiItem>(`/kpis/${id}`, data);
    return response.data;
  },

  async deleteKpi(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/kpis/${id}`);
    return response.data;
  },

  // --- Tab 2: Metrics & Formula ---
  async getMetrics(): Promise<{
    defaultMetrics: MetricDefinition[];
    customMetrics: MetricDefinition[];
  }> {
    const response = await api.get<{
      defaultMetrics: MetricDefinition[];
      customMetrics: MetricDefinition[];
    }>('/kpis/metrics');
    return response.data;
  },

  async createCustomMetric(data: CreateCustomMetricInput): Promise<MetricDefinition> {
    const response = await api.post<MetricDefinition>('/kpis/metrics/custom', data);
    return response.data;
  },

  async deleteCustomMetric(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/kpis/metrics/custom/${id}`);
    return response.data;
  },

  async validateFormula(data: ValidateFormulaInput): Promise<ValidateFormulaResponse> {
    const response = await api.post<ValidateFormulaResponse>('/kpis/formula/validate', data);
    return response.data;
  },

  async previewFormula(data: ValidateFormulaInput): Promise<PreviewFormulaResponse> {
    const response = await api.post<PreviewFormulaResponse>('/kpis/formula/preview', data);
    return response.data;
  },

  // --- Tab 3: Alert Rules ---
  async getAlertRules(): Promise<AlertRuleItem[]> {
    const response = await api.get<AlertRuleItem[]>('/kpis/alerts');
    return response.data;
  },

  async createAlertRule(data: CreateAlertRuleInput): Promise<AlertRuleItem> {
    const response = await api.post<AlertRuleItem>('/kpis/alerts', data);
    return response.data;
  },

  async updateAlertRule(id: string, data: UpdateAlertRuleInput): Promise<AlertRuleItem> {
    const response = await api.patch<AlertRuleItem>(`/kpis/alerts/${id}`, data);
    return response.data;
  },

  async toggleAlertRule(id: string): Promise<AlertRuleItem> {
    const response = await api.patch<AlertRuleItem>(`/kpis/alerts/${id}/toggle`);
    return response.data;
  },

  async deleteAlertRule(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/kpis/alerts/${id}`);
    return response.data;
  },
};
