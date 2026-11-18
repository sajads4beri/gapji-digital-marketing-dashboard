import type { IDashboardService } from './dashboard.contract';
import type {
  DashboardDataPayload,
  DashboardDateRangeFilter,
  ExecutiveKpiSummary,
  TrendChartDataPoint,
  ChannelPerformanceMetric,
  FunnelStage,
  UrgentAlertItem,
} from '../types';
import { campaignService } from '@/features/campaigns/api';
import { leadService } from '@/features/leads/api';
import { taskService } from '@/features/tasks/api';
import { costService } from '@/features/costs';
import { isTaskOverdue, getOverdueDays } from '@/features/tasks/utils/task-grouping';
import { isoToJalali, PERSIAN_MONTH_NAMES } from '@/lib/persian-date';

/**
 * توابع محاسبات ریاضی فرمول‌های KPI با محافظت در برابر تقسیم بر صفر
 */
export function calculateRoas(revenue: number, spend: number): number | null {
  if (spend <= 0 || !isFinite(spend) || isNaN(spend)) return null;
  const val = revenue / spend;
  if (!isFinite(val) || isNaN(val)) return null;
  return Math.round(val * 100) / 100;
}

export function calculateCac(totalAcquisitionCost: number, wonCustomers: number): number | null {
  if (wonCustomers <= 0 || !isFinite(wonCustomers) || isNaN(wonCustomers)) return null;
  const val = totalAcquisitionCost / wonCustomers;
  if (!isFinite(val) || isNaN(val)) return null;
  return Math.round(val);
}

export function calculateCpl(spend: number, leadsCount: number): number | null {
  if (leadsCount <= 0 || !isFinite(leadsCount) || isNaN(leadsCount)) return null;
  const val = spend / leadsCount;
  if (!isFinite(val) || isNaN(val)) return null;
  return Math.round(val);
}

export function calculateConversionRate(wonCount: number, totalCount: number): number {
  if (totalCount <= 0 || !isFinite(totalCount) || isNaN(totalCount)) return 0;
  const val = (wonCount / totalCount) * 100;
  if (!isFinite(val) || isNaN(val)) return 0;
  return Math.round(val * 10) / 10;
}

/**
 * شبیه‌ساز تاخیر شبکه
 */
async function simulateDelay(ms = 80): Promise<void> {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DashboardMockService implements IDashboardService {
  async getDashboardData(filter?: DashboardDateRangeFilter): Promise<DashboardDataPayload> {
    await simulateDelay();

    const now = new Date();
    const msInDay = 86400000;

    // ۱. دریافت داده‌های ماژول‌های فعال موجود به صورت موازی (شامل ماژول Costs)
    const [campaigns, leads, tasks, allCosts] = await Promise.all([
      campaignService.getAll().catch(() => []),
      leadService.getAll().catch(() => []),
      taskService.getAll().catch(() => []),
      costService.getAll().catch(() => []),
    ]);

    // ۲. فیلتر زمانی هزینه‌ها بر اساس بازه انتخابی
    let cutoffIsoDate: string | null = null;
    if (filter?.preset === '7d') {
      cutoffIsoDate = new Date(now.getTime() - 7 * msInDay).toISOString().split('T')[0];
    } else if (filter?.preset === '30d') {
      cutoffIsoDate = new Date(now.getTime() - 30 * msInDay).toISOString().split('T')[0];
    } else if (filter?.preset === 'this_month') {
      cutoffIsoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    const filteredCosts = allCosts.filter((c) => {
      if (filter?.from && c.date < filter.from) return false;
      if (filter?.to && c.date > filter.to) return false;
      if (cutoffIsoDate && c.date < cutoffIsoDate) return false;
      return true;
    });

    // قواعد مالی گام ۱۰G.6:
    // الف) هزینه‌های قطعی صرفاً شامل paid و pending هستند؛ هزینه‌های draft نباید وارد محاسبات قطعی شوند
    const realizedCosts = filteredCosts.filter(
      (c) => c.status === 'paid' || c.status === 'pending'
    );

    // ب) هزینه رسانه‌ای مستقیم (Ad Spend) فقط شامل رکوردهایی با دسته‌بندی ad_media است
    const directAdCosts = realizedCosts.filter((c) => c.category === 'ad_media');
    const directAdSpendFromCosts = directAdCosts.reduce(
      (acc, c) => acc + c.normalizedAmountToman,
      0
    );

    // ج) مجموع کل هزینه بازاریابی (شامل تمامی دسته‌بندی‌ها)
    const totalMarketingCostFromCosts = realizedCosts.reduce(
      (acc, c) => acc + c.normalizedAmountToman,
      0
    );

    // د) محاسبه هزینه هر کمپین با سیاست Fallback شفاف
    const campaignLiveSpends = new Map<string, number>();
    for (const c of campaigns) {
      const campCosts = directAdCosts.filter((cost) => cost.campaignId === c.id);
      const campSpendFromCosts = campCosts.reduce(
        (acc, cost) => acc + cost.normalizedAmountToman,
        0
      );
      // در صورت وجود رکورد در ماژول Costs، از جمع تومانی آن استفاده می‌شود، وگرنه از c.spend موجود
      const effectiveSpend = campSpendFromCosts > 0 ? campSpendFromCosts : (c.spend || 0);
      campaignLiveSpends.set(c.id, effectiveSpend);
    }

    // بودجه مصوب کل
    const approvedBudget =
      campaigns.reduce((acc, c) => acc + (c.budget || 0), 0) || 185_000_000;

    // مجموع هزینه رسانه‌ای مستقیم (Ad Spend) جهت محاسبه ROAS و CPL
    const totalSpend =
      directAdSpendFromCosts > 0
        ? directAdSpendFromCosts
        : campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) || 124_500_000;

    // مجموع کل هزینه بازاریابی جهت محاسبه CAC
    const totalMarketingCost =
      totalMarketingCostFromCosts > 0 ? totalMarketingCostFromCosts : totalSpend;

    const totalImpressions =
      campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0) || 840_000;
    const totalClicks =
      campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0) || 46_200;

    // آمار لیدها
    const totalLeads = leads.length || 184;
    const wonLeadsList = leads.filter((l) => l.status === 'won');
    const wonCustomersCount = wonLeadsList.length || 23;

    // مجموع ارزش معاملات موفق
    const leadsWonDealValue = wonLeadsList.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
    // درآمد کل = معاملات لیدها + فروش‌های مستقیم کمپین‌ها
    const totalRevenue = leadsWonDealValue > 0 ? leadsWonDealValue + 120_000_000 : 428_000_000;

    // محاسبه شاخص‌های رسمی سند
    const roas = calculateRoas(totalRevenue, totalSpend);
    const cac = calculateCac(totalMarketingCost, wonCustomersCount);
    const cpl = calculateCpl(totalSpend, totalLeads);
    const leadConversionRate = calculateConversionRate(wonCustomersCount, totalLeads);
    const budgetConsumedPercentage =
      approvedBudget > 0 ? Math.round((totalSpend / approvedBudget) * 100) : 0;

    const kpis: ExecutiveKpiSummary = {
      totalSpend,
      totalSpendChangePercentage: null,
      totalSpendTargetProgress: budgetConsumedPercentage,
      budgetConsumedPercentage,
      totalLeads,
      totalLeadsChangePercentage: null,
      totalLeadsTargetProgress: null,
      cpl,
      cplChangePercentage: null,
      conversionRate: leadConversionRate,
      conversionRateChangePercentage: null,
      leadConversionRate,
      roas,
      roasChangePercentage: null,
      cac,
      cacChangePercentage: null,
      totalRevenue,
      wonCustomersCount,
      approvedBudget,
      totalImpressions,
      totalClicks,
    };

    // ۳. تولید نقاط نمودار روند هزینه در برابر درآمد (Spend vs Revenue) به صورت پویا نسبت به تاریخ جاری
    const trends: TrendChartDataPoint[] = [];
    const daysCount = filter?.preset === '7d' ? 7 : filter?.preset === '30d' ? 14 : 10;

    for (let i = daysCount - 1; i >= 0; i--) {
      const pointDate = new Date(now.getTime() - i * msInDay);
      const isoDate = pointDate.toISOString().split('T')[0];
      const j = isoToJalali(isoDate);
      const label = j.isValid ? `${j.day} ${PERSIAN_MONTH_NAMES[j.month - 1] || ''}` : isoDate;

      // توزیع متناسب و واقع‌گرایانه داده‌ها
      const baseDailySpend = Math.round(totalSpend / (daysCount * 1.2));
      const variation = Math.sin(i * 1.5) * 0.3 + 1; // ضریب تغییرات طبیعی
      const dailySpend = Math.round(baseDailySpend * variation);
      const dailyRevenue = Math.round(dailySpend * (roas ? roas * (0.8 + (i % 3) * 0.2) : 3.2));
      const dailyLeads = Math.max(1, Math.round(dailySpend / (cpl || 680_000)));

      trends.push({
        date: isoDate,
        label,
        spend: dailySpend,
        revenue: dailyRevenue,
        leadsCount: dailyLeads,
      });
    }

    // ۴. عملکرد کانال‌های بازاریابی منسجم با کل هزینه سیستم (Zero Double-Counting)
    const googleSpend = realizedCosts
      .filter((c) => c.channel === 'google_ads')
      .reduce((acc, c) => acc + c.normalizedAmountToman, 0);
    const instaSpend = realizedCosts
      .filter((c) => c.channel === 'instagram')
      .reduce((acc, c) => acc + c.normalizedAmountToman, 0);
    const smsSpend = realizedCosts
      .filter((c) => c.channel === 'sms')
      .reduce((acc, c) => acc + c.normalizedAmountToman, 0);
    const webinarSpend = realizedCosts
      .filter((c) => c.channel === 'webinar')
      .reduce((acc, c) => acc + c.normalizedAmountToman, 0);
    const emailSpend = realizedCosts
      .filter((c) => c.channel === 'email')
      .reduce((acc, c) => acc + c.normalizedAmountToman, 0);

    const chTotalFromCosts = googleSpend + instaSpend + smsSpend + webinarSpend + emailSpend;

    let chGoogleSpend: number;
    let chInstaSpend: number;
    let chSmsSpend: number;
    let chWebinarSpend: number;
    let chEmailSpend: number;

    if (chTotalFromCosts > 0) {
      // تسهیم متناسب بر مبنای هزینه‌های ثبت‌شده کانال‌ها
      chGoogleSpend = Math.round((googleSpend / chTotalFromCosts) * totalSpend);
      chInstaSpend = Math.round((instaSpend / chTotalFromCosts) * totalSpend);
      chSmsSpend = Math.round((smsSpend / chTotalFromCosts) * totalSpend);
      chWebinarSpend = Math.round((webinarSpend / chTotalFromCosts) * totalSpend);
      chEmailSpend = totalSpend - (chGoogleSpend + chInstaSpend + chSmsSpend + chWebinarSpend);
    } else {
      chGoogleSpend = Math.round(totalSpend * 0.45);
      chInstaSpend = Math.round(totalSpend * 0.25);
      chSmsSpend = Math.round(totalSpend * 0.12);
      chWebinarSpend = Math.round(totalSpend * 0.12);
      chEmailSpend = totalSpend - (chGoogleSpend + chInstaSpend + chSmsSpend + chWebinarSpend);
    }

    const channels: ChannelPerformanceMetric[] = [
      {
        id: 'ch-google',
        name: 'گوگل ادز (Google Ads)',
        channelType: 'google_ads',
        spend: chGoogleSpend,
        leads: Math.round(totalLeads * 0.42),
        customers: Math.round(wonCustomersCount * 0.45),
        revenue: Math.round(totalRevenue * 0.48),
        cpl: calculateCpl(chGoogleSpend, Math.round(totalLeads * 0.42)),
        roas: calculateRoas(Math.round(totalRevenue * 0.48), chGoogleSpend),
        sharePercentage: totalSpend > 0 ? Math.round((chGoogleSpend / totalSpend) * 100) : 0,
      },
      {
        id: 'ch-instagram',
        name: 'اینستاگرام و شبکه‌های اجتماعی',
        channelType: 'instagram',
        spend: chInstaSpend,
        leads: Math.round(totalLeads * 0.3),
        customers: Math.round(wonCustomersCount * 0.25),
        revenue: Math.round(totalRevenue * 0.22),
        cpl: calculateCpl(chInstaSpend, Math.round(totalLeads * 0.3)),
        roas: calculateRoas(Math.round(totalRevenue * 0.22), chInstaSpend),
        sharePercentage: totalSpend > 0 ? Math.round((chInstaSpend / totalSpend) * 100) : 0,
      },
      {
        id: 'ch-sms',
        name: 'پیامک و بازاریابی مستقیم',
        channelType: 'sms',
        spend: chSmsSpend,
        leads: Math.round(totalLeads * 0.13),
        customers: Math.round(wonCustomersCount * 0.12),
        revenue: Math.round(totalRevenue * 0.14),
        cpl: calculateCpl(chSmsSpend, Math.round(totalLeads * 0.13)),
        roas: calculateRoas(Math.round(totalRevenue * 0.14), chSmsSpend),
        sharePercentage: totalSpend > 0 ? Math.round((chSmsSpend / totalSpend) * 100) : 0,
      },
      {
        id: 'ch-webinar',
        name: 'وبینارها و رویدادهای تخصصی',
        channelType: 'webinar',
        spend: chWebinarSpend,
        leads: Math.round(totalLeads * 0.1),
        customers: Math.round(wonCustomersCount * 0.13),
        revenue: Math.round(totalRevenue * 0.12),
        cpl: calculateCpl(chWebinarSpend, Math.round(totalLeads * 0.1)),
        roas: calculateRoas(Math.round(totalRevenue * 0.12), chWebinarSpend),
        sharePercentage: totalSpend > 0 ? Math.round((chWebinarSpend / totalSpend) * 100) : 0,
      },
      {
        id: 'ch-email',
        name: 'ایمیل مارکتینگ و خبرنامه',
        channelType: 'email',
        spend: chEmailSpend,
        leads: Math.round(totalLeads * 0.05),
        customers: Math.round(wonCustomersCount * 0.05),
        revenue: Math.round(totalRevenue * 0.04),
        cpl: calculateCpl(chEmailSpend, Math.round(totalLeads * 0.05)),
        roas: calculateRoas(Math.round(totalRevenue * 0.04), chEmailSpend),
        sharePercentage: totalSpend > 0 ? Math.round((chEmailSpend / totalSpend) * 100) : 0,
      },
    ];

    // ۵. قیف نرخ تبدیل (Marketing Funnel)
    const opportunitiesCount = Math.round(totalLeads * 0.38);
    const funnel: FunnelStage[] = [
      {
        id: 'clicks',
        label: 'کلیک روی لینک لندینگ (Clicks)',
        count: totalClicks,
        conversionFromPrevious: 100,
        dropoffPercentage: 0,
      },
      {
        id: 'leads',
        label: 'ثبت سرنخ و لید (Leads)',
        count: totalLeads,
        conversionFromPrevious: calculateConversionRate(totalLeads, totalClicks),
        dropoffPercentage: Math.max(0, 100 - calculateConversionRate(totalLeads, totalClicks)),
      },
      {
        id: 'qualified',
        label: 'لید واجد شرایط (Qualified)',
        count: opportunitiesCount,
        conversionFromPrevious: calculateConversionRate(opportunitiesCount, totalLeads),
        dropoffPercentage: Math.max(0, 100 - calculateConversionRate(opportunitiesCount, totalLeads)),
      },
      {
        id: 'proposal',
        label: 'ارائه پیشنهاد (Proposal)',
        count: Math.round(opportunitiesCount * 0.6),
        conversionFromPrevious: calculateConversionRate(Math.round(opportunitiesCount * 0.6), opportunitiesCount),
        dropoffPercentage: Math.max(0, 100 - calculateConversionRate(Math.round(opportunitiesCount * 0.6), opportunitiesCount)),
      },
      {
        id: 'customer',
        label: 'مشتری نهایی (Customer)',
        count: wonCustomersCount,
        conversionFromPrevious: calculateConversionRate(wonCustomersCount, Math.round(opportunitiesCount * 0.6)),
        dropoffPercentage: Math.max(0, 100 - calculateConversionRate(wonCustomersCount, Math.round(opportunitiesCount * 0.6))),
      },
    ];

    // ۶. استخراج هشدارهای فوری زنده از سیستم
    const alerts: UrgentAlertItem[] = [];

    // الف) کمپین‌های نزدیک به اتمام بودجه (محاسبه‌شده از هزینه واقعی ماژول Costs)
    const highSpendCampaign = campaigns.find((c) => {
      const liveSpend = campaignLiveSpends.get(c.id) ?? (c.spend || 0);
      return liveSpend >= c.budget * 0.85;
    });

    if (highSpendCampaign) {
      alerts.push({
        id: `alert-camp-${highSpendCampaign.id}`,
        severity: 'warning',
        source: 'budget',
        title: `مصرف بالای بودجه در کمپین «${highSpendCampaign.name}»`,
        description: `بیش از ۸۵ درصد از بودجه مصوب این کمپین مصرف شده است. نیاز به تمدید یا پایش دارد.`,
        actionLabel: 'مشاهده کمپین',
        actionType: 'navigate',
        actionHref: `/campaigns/${highSpendCampaign.id}`,
        createdAt: now.toISOString(),
      });
    }

    // ب) فاکتورهای معوق با اولویت پرداخت از ماژول Costs
    const pendingInvoices = allCosts.filter((c) => c.status === 'pending');
    const totalPendingAmount = pendingInvoices.reduce((acc, c) => acc + c.normalizedAmountToman, 0);
    if (totalPendingAmount > 20_000_000) {
      alerts.push({
        id: 'alert-cost-pending-high',
        severity: 'warning',
        source: 'budget',
        title: 'فاکتورهای تسویه‌نشده نیازمند پیگیری مالی',
        description: `مبلغ ${Math.round(totalPendingAmount / 1_000_000)} میلیون تومان فاکتور در انتظار پرداخت در ماژول هزینه‌ها ثبت شده است.`,
        actionLabel: 'مشاهده هزینه‌ها',
        actionType: 'navigate',
        actionHref: '/performance/costs?status=pending',
        createdAt: now.toISOString(),
      });
    }

    // ج) لیدهای جدید نیازمند تماس فوری
    const unassignedLead = leads.find((l) => !l.assignedTo || l.status === 'new');
    if (unassignedLead) {
      alerts.push({
        id: `alert-lead-${unassignedLead.id}`,
        severity: 'critical',
        source: 'lead',
        title: 'سرنخ‌های جدید نیازمند پیگیری اولیه',
        description: `سرنخ «${unassignedLead.fullName}» هنوز تماس اولیه ثبت نکرده یا به کارشناس تخصیص نیافته است.`,
        actionLabel: 'صندوق لیدها',
        actionType: 'navigate',
        actionHref: '/leads',
        createdAt: now.toISOString(),
      });
    }

    // د) تسک‌های دارای تأخیر
    const overdueTask = tasks.find((t) => isTaskOverdue(t, now));
    if (overdueTask) {
      const days = getOverdueDays(overdueTask, now);
      alerts.push({
        id: `alert-task-${overdueTask.id}`,
        severity: 'warning',
        source: 'task',
        title: `تسک عقب‌افتاده: «${overdueTask.title}»`,
        description: `این اقدام اجرایی دارای ${days} روز تأخیر نسبت به موعد مقرر است.`,
        actionLabel: 'مدیریت تسک‌ها',
        actionType: 'navigate',
        actionHref: '/work/tasks?status=overdue',
        createdAt: now.toISOString(),
      });
    }

    // هشدار نمونه پیش‌فرض در صورت نبود هیچ هشداری
    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-default',
        severity: 'info',
        source: 'campaign',
        title: 'تمام شاخص‌های عملکردی در وضعیت مطلوب هستند',
        description: 'هیچ انحراف منفی یا پیگیری معوقه‌ای در کمپین‌ها و لیدهای سیستم یافت نشد.',
        actionLabel: 'بررسی کمپین‌ها',
        actionType: 'navigate',
        actionHref: '/campaigns',
        createdAt: now.toISOString(),
      });
    }

    return {
      dateRange: filter || { preset: '30d' },
      kpis,
      spendTrend: trends.map((t) => ({ date: t.date, label: t.label, spend: t.spend })),
      leadTrend: trends.map((t) => ({ date: t.date, label: t.label, leadsCount: t.leadsCount || 0 })),
      funnel,
      platformShares: [],
      campaigns: [],
      alerts,
      trends,
      channels,
      isMockData: true,
      generatedAt: now.toISOString(),
    };
  }
}

export const dashboardService = new DashboardMockService();
