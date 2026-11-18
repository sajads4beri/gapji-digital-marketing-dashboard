/**
 * تعاریف و تایپ‌های داده ماژول داشبورد اجرایی عملکرد (Executive Dashboard)
 * منطبق بر سند نیازمندی‌های محصول (Phase 1: Frontend Pages - صفحه ۸)
 */

export type DashboardDatePreset = 'today' | '7d' | '30d' | 'this_month' | 'custom';

export interface DashboardDateRangeFilter {
  preset?: DashboardDatePreset;
  from?: string; // فرمت ISO YYYY-MM-DD
  to?: string;   // فرمت ISO YYYY-MM-DD
  campaignIds?: string[];
  platformIds?: string[];
  comparePrevious?: boolean;
  previousFrom?: string;
  previousTo?: string;
}

/**
 * ۶ کارت شاخص کلیدی عملکرد اجرایی (صفحه ۸ سند)
 */
export interface ExecutiveKpiSummary {
  // ۱. هزینه کل تبلیغات (Total Ad Spend)
  totalSpend: number;
  totalSpendChangePercentage: number | null;
  totalSpendTargetProgress: number | null;
  budgetConsumedPercentage?: number | null;

  // ۲. تعداد کل لیدها (Total Leads)
  totalLeads: number;
  totalLeadsChangePercentage: number | null;
  totalLeadsTargetProgress: number | null;

  // ۳. هزینه به ازای هر لید (CPL)
  cpl: number | null;
  cplChangePercentage: number | null;

  // ۴. نرخ تبدیل کل (Conversion Rate)
  conversionRate: number | null;
  conversionRateChangePercentage: number | null;
  leadConversionRate?: number | null;

  // ۵. بازگشت هزینه تبلیغات (ROAS)
  roas: number | null;
  roasChangePercentage: number | null;

  // ۶. هزینه جذب مشتری (CAC)
  cac: number | null;
  cacChangePercentage: number | null;

  // متغیرهای محاسباتی درون‌برنامه‌ای
  totalRevenue: number;
  wonCustomersCount: number;
  approvedBudget: number;
  totalImpressions?: number;
  totalClicks?: number;
}

/**
 * نقاط داده نمودار روند روزانه هزینه تبلیغات (Spend Trend)
 */
export interface SpendTrendPoint {
  date: string;       // تاریخ میلادی ISO YYYY-MM-DD
  label: string;      // برچسب شمسی (مانند: ۱۹ آبان)
  spend: number;      // هزینه ثبتی روزانه
}

/**
 * نقاط داده نمودار روند روزانه جذب لید (Lead Trend)
 */
export interface LeadTrendPoint {
  date: string;       // تاریخ میلادی ISO YYYY-MM-DD
  label: string;      // برچسب شمسی (مانند: ۱۹ آبان)
  leadsCount: number; // تعداد لیدهای جذب‌شده روزانه
}

/**
 * مراحل ۵‌گانه قیف تبدیل (صفحه ۸ سند: کلیک، لید، واجد شرایط، پیشنهاد، مشتری)
 */
export interface FunnelStage {
  id: 'clicks' | 'leads' | 'qualified' | 'proposal' | 'customer' | string;
  label: string;
  count: number | null;
  conversionFromPrevious: number | null; // درصد تبدیل نسبت به مرحله قبل (null در صورت عدم امکان محاسبه یا نبود داده)
  dropoffPercentage: number | null;      // درصد ریزش (null در صورت عدم امکان محاسبه)
  overallConversion?: number | null;
  isAvailable?: boolean;
}

/**
 * سهم پلتفرم‌های تبلیغاتی از هزینه‌ها
 */
export interface PlatformShareItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  spend: number;
  sharePercentage: number;
}

/**
 * ردیف داده‌های جدول کمپین‌ها (صفحه ۸ ردیف ۵)
 */
export interface DashboardCampaignItem {
  id: string;
  name: string;
  status: string;
  health: string;
  spend: number;
  leadsCount: number;
  cpl: number | null;
  conversionRate: number | null;
}

/**
 * هشدارهای فوری و اقدامات موردنیاز در داشبورد
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface UrgentAlertItem {
  id: string;
  severity: AlertSeverity;
  source: 'campaign' | 'lead' | 'budget' | 'task';
  title: string;
  description: string;
  campaignId?: string;
  campaignName?: string;
  actionLabel: string;
  actionType: 'create_task' | 'navigate';
  actionHref?: string;
  createdAt: string;
}

export interface DashboardFilterOptions {
  availableCampaigns: Array<{ id: string; name: string }>;
  availablePlatforms: Array<{ id: string; name: string; code?: string }>;
}

/**
 * انواع داده‌های کمکی برای نمودارهای روند ترکیبی و کانال‌ها
 */
export interface TrendChartDataPoint {
  date: string;
  label: string;
  spend: number;
  revenue: number;
  leadsCount?: number;
}

export interface ChannelPerformanceMetric {
  id: string;
  name: string;
  code?: string;
  channelType?: string;
  category?: string;
  spend: number;
  sharePercentage?: number;
  leadsCount?: number;
  leads?: number;
  customers?: number;
  revenue?: number;
  roas?: number | null;
  cpl?: number | null;
}

/**
 * بسته داده کامل ارائه‌شده توسط DashboardService
 */
export interface DashboardDataPayload {
  dateRange: DashboardDateRangeFilter;
  kpis: ExecutiveKpiSummary;
  spendTrend: SpendTrendPoint[];
  leadTrend: LeadTrendPoint[];
  funnel: FunnelStage[];
  platformShares: PlatformShareItem[];
  campaigns: DashboardCampaignItem[];
  alerts: UrgentAlertItem[];
  filters?: DashboardFilterOptions;
  isMockData: boolean;
  generatedAt: string;
  // فیلدهای کمکی برای سازگاری عقب‌رو
  trends?: TrendChartDataPoint[];
  channels?: ChannelPerformanceMetric[];
}
