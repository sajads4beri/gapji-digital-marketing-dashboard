import {
  Injectable,
  Logger,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

export interface CurrentUserPayload {
  id: string;
  email?: string;
  fullName?: string;
  organizationId: string | null;
  role: string;
}

const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

/**
 * 6 Primary KPI cards required by Document Page 8
 */
export interface ExecutiveKpiSummary {
  // 1. Total Ad Spend
  totalSpend: number;
  totalSpendChangePercentage: number | null;
  totalSpendTargetProgress: number | null;

  // 2. Total Leads
  totalLeads: number;
  totalLeadsChangePercentage: number | null;
  totalLeadsTargetProgress: number | null;

  // 3. CPL (Cost Per Lead)
  cpl: number | null;
  cplChangePercentage: number | null;

  // 4. Conversion Rate (Won Leads / Total Leads * 100)
  conversionRate: number | null;
  conversionRateChangePercentage: number | null;

  // 5. ROAS (Revenue / Ad Spend)
  roas: number | null;
  roasChangePercentage: number | null;

  // 6. CAC (Customer Acquisition Cost)
  cac: number | null;
  cacChangePercentage: number | null;

  // Internal auxiliary calculations
  totalRevenue: number;
  wonCustomersCount: number;
  approvedBudget: number;
}

export interface SpendTrendPoint {
  date: string;       // ISO YYYY-MM-DD
  label: string;      // Persian date label (e.g. ۱۹ آبان)
  spend: number;      // Actual spend on this day
}

export interface LeadTrendPoint {
  date: string;       // ISO YYYY-MM-DD
  label: string;      // Persian date label (e.g. ۱۹ آبان)
  leadsCount: number; // Actual leads created on this day
}

export interface FunnelStage {
  id: 'clicks' | 'leads' | 'qualified' | 'proposal' | 'customer';
  label: string;
  count: number | null;
  conversionFromPrevious: number | null; // Conversion percentage from previous stage (null if unavailable or prev is 0)
  dropoffPercentage: number | null;      // Dropoff percentage (null if unavailable)
  isAvailable?: boolean;
}

export interface PlatformShareItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  spend: number;
  sharePercentage: number;
}

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

export interface DashboardAlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  source: 'campaign' | 'lead' | 'budget';
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

export interface DashboardDataPayload {
  dateRange: {
    preset?: string;
    from?: string;
    to?: string;
    comparePrevious?: boolean;
    previousFrom?: string;
    previousTo?: string;
  };
  kpis: ExecutiveKpiSummary;
  spendTrend: SpendTrendPoint[];
  leadTrend: LeadTrendPoint[];
  funnel: FunnelStage[];
  platformShares: PlatformShareItem[];
  campaigns: DashboardCampaignItem[];
  alerts: DashboardAlertItem[];
  filters: DashboardFilterOptions;
  isMockData: boolean;
  generatedAt: string;
}

function parseArrayParam(param?: string | string[]): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param.map((s) => String(s).trim()).filter(Boolean);
  return String(param)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function calcPercentageChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enforces 6-role RBAC for Executive Dashboard (DEC-AUTH-11 & Section 5)
   * - admin, marketing_manager, client: Allowed
   * - campaign_manager, sales_agent, content_creator: Forbidden (403)
   */
  public assertDashboardAccess(user?: CurrentUserPayload): void {
    if (!user) {
      throw new UnauthorizedException('احراز هویت الزامی است.');
    }
    if (!user.organizationId) {
      throw new BadRequestException('سازمان کاربر مشخص نشده است.');
    }

    const allowedRoles = ['admin', 'owner', 'marketing_manager', 'client'];
    if (!allowedRoles.includes(user.role)) {
      this.logger.warn(`User ${user.id} with role ${user.role} denied access to Executive Dashboard`);
      throw new ForbiddenException('دسترسی به داشبورد اجرایی عملکرد برای نقش شما مجاز نمی‌باشد.');
    }
  }

  /**
   * Calculates the exact start date of the current Jalali month in Asia/Tehran
   */
  public getJalaliMonthStart(now: Date): Date {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tehran',
    }).formatToParts(now);
    const jDay = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
    // Subtract (jDay - 1) days from now to get day 1 of the current Jalali month
    const start = new Date(now.getTime() - (jDay - 1) * 86400000);
    const isoDateStr = start.toISOString().split('T')[0];
    return new Date(`${isoDateStr}T00:00:00.000Z`);
  }

  /**
   * Generates real PostgreSQL-backed executive dashboard metrics
   */
  async getOverview(
    query: DashboardQueryDto,
    user?: CurrentUserPayload,
  ): Promise<DashboardDataPayload> {
    this.assertDashboardAccess(user);
    const organizationId = user?.organizationId ?? DEFAULT_ORGANIZATION_ID;

    const now = new Date();
    const msInDay = 86400000;

    // 1. Resolve date boundaries
    let fromIso: string | undefined = query.from;
    let toIso: string | undefined = query.to;

    if (!fromIso && !toIso) {
      const preset = query.preset || '30d';
      if (preset === '7d') {
        fromIso = new Date(now.getTime() - 7 * msInDay).toISOString().split('T')[0];
        toIso = now.toISOString().split('T')[0];
      } else if (preset === '30d') {
        fromIso = new Date(now.getTime() - 30 * msInDay).toISOString().split('T')[0];
        toIso = now.toISOString().split('T')[0];
      } else if (preset === 'this_month') {
        const jalaliStart = this.getJalaliMonthStart(now);
        fromIso = jalaliStart.toISOString().split('T')[0];
        toIso = now.toISOString().split('T')[0];
      }
    }

    const fromDate = fromIso ? new Date(`${fromIso}T00:00:00.000Z`) : undefined;
    const toDate = toIso ? new Date(`${toIso}T23:59:59.999Z`) : undefined;

    // Calculate equivalent previous period for comparison
    const comparePrevious =
      query.comparePrevious === true ||
      query.comparePrevious === 'true' ||
      query.comparePrevious === '1';

    let prevFromDate: Date | undefined;
    let prevToDate: Date | undefined;

    if (comparePrevious && fromDate && toDate) {
      const durationMs = toDate.getTime() - fromDate.getTime();
      prevToDate = new Date(fromDate.getTime() - 1);
      prevFromDate = new Date(prevToDate.getTime() - durationMs);
    }

    // 2. Parse multi-select filter parameters
    const selectedCampaignIds = parseArrayParam(query.campaignIds);
    const selectedPlatformIds = parseArrayParam(query.platformIds);

    // 3. Fetch filter options (available campaigns & platforms in organization)
    const [allOrgCampaigns, allOrgPlatforms] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { organizationId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.platform.findMany({
        where: { organizationId },
        select: { id: true, name: true, code: true, category: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // 4. Query campaigns in scope
    const campaignWhere: any = { organizationId };
    if (selectedCampaignIds.length > 0) {
      campaignWhere.id = { in: selectedCampaignIds };
    }

    const campaigns = await this.prisma.campaign.findMany({
      where: campaignWhere,
      orderBy: { createdAt: 'desc' },
    });

    const approvedBudget = campaigns.reduce((acc, c) => acc + Number(c.budget || 0), 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
    const targetLeadsSum = campaigns.reduce((acc, c) => acc + (c.targetLeads || 0), 0);

    // 5. Query Costs in scope (Strict authoritative spend ledger, ZERO fallback)
    const costWhere: any = { organizationId };
    if (fromDate || toDate) {
      costWhere.date = {};
      if (fromDate) costWhere.date.gte = fromDate;
      if (toDate) costWhere.date.lte = toDate;
    }
    if (selectedCampaignIds.length > 0) {
      costWhere.campaignId = { in: selectedCampaignIds };
    }
    if (selectedPlatformIds.length > 0) {
      costWhere.platformId = { in: selectedPlatformIds };
    }

    const costs = await this.prisma.cost.findMany({
      where: costWhere,
      include: {
        platform: { select: { id: true, name: true, code: true, category: true } },
        campaign: { select: { id: true, name: true, channel: true } },
      },
      orderBy: { date: 'asc' },
    });

    const realizedCosts = costs.filter((c: any) => c.status !== 'draft');

    // Authoritative total spend: sum of non-draft costs in date range. ZERO fallback!
    const totalSpend = realizedCosts.reduce(
      (acc: number, c: any) => acc + Number(c.amount || 0),
      0,
    );

    // 6. Query Leads in scope
    const leadWhere: any = { organizationId };
    if (fromDate || toDate) {
      leadWhere.createdAt = {};
      if (fromDate) leadWhere.createdAt.gte = fromDate;
      if (toDate) leadWhere.createdAt.lte = toDate;
    }
    if (selectedCampaignIds.length > 0) {
      leadWhere.campaignId = { in: selectedCampaignIds };
    }
    if (selectedPlatformIds.length > 0) {
      leadWhere.platformId = { in: selectedPlatformIds };
    }

    const leads = await this.prisma.lead.findMany({
      where: leadWhere,
      orderBy: { createdAt: 'asc' },
    });

    const totalLeads = leads.length;
    const wonLeads = leads.filter((l) => l.statusKey === 'won');
    const wonCustomersCount = wonLeads.length;
    const totalRevenue = wonLeads.reduce((acc, l) => acc + Number(l.salesValue || 0), 0);

    // 7. Calculate Current Period KPIs
    const cpl = totalLeads > 0 && totalSpend > 0 ? Math.round(totalSpend / totalLeads) : null;
    const conversionRate =
      totalLeads > 0 ? Math.round((wonCustomersCount / totalLeads) * 1000) / 10 : null;
    const roas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : null;
    const cac = wonCustomersCount > 0 && totalSpend > 0 ? Math.round(totalSpend / wonCustomersCount) : null;

    // Target progress
    const totalSpendTargetProgress =
      approvedBudget > 0 ? Math.round((totalSpend / approvedBudget) * 100) : null;
    const totalLeadsTargetProgress =
      targetLeadsSum > 0 ? Math.round((totalLeads / targetLeadsSum) * 100) : null;

    // 8. Calculate Previous Period KPIs for Comparison
    let totalSpendChangePercentage: number | null = null;
    let totalLeadsChangePercentage: number | null = null;
    let cplChangePercentage: number | null = null;
    let conversionRateChangePercentage: number | null = null;
    let roasChangePercentage: number | null = null;
    let cacChangePercentage: number | null = null;

    if (prevFromDate && prevToDate) {
      const prevCostWhere: any = {
        organizationId,
        date: { gte: prevFromDate, lte: prevToDate },
      };
      if (selectedCampaignIds.length > 0) prevCostWhere.campaignId = { in: selectedCampaignIds };
      if (selectedPlatformIds.length > 0) prevCostWhere.platformId = { in: selectedPlatformIds };

      const prevLeadWhere: any = {
        organizationId,
        createdAt: { gte: prevFromDate, lte: prevToDate },
      };
      if (selectedCampaignIds.length > 0) prevLeadWhere.campaignId = { in: selectedCampaignIds };
      if (selectedPlatformIds.length > 0) prevLeadWhere.platformId = { in: selectedPlatformIds };

      const [prevCosts, prevLeads] = await Promise.all([
        this.prisma.cost.findMany({ where: prevCostWhere }),
        this.prisma.lead.findMany({ where: prevLeadWhere }),
      ]);

      const prevRealizedCosts = prevCosts.filter((c: any) => c.status !== 'draft');
      const prevSpend = prevRealizedCosts.reduce((acc, c) => acc + Number(c.amount || 0), 0);
      const prevTotalLeads = prevLeads.length;
      const prevWonLeads = prevLeads.filter((l) => l.statusKey === 'won');
      const prevWonCount = prevWonLeads.length;
      const prevRevenue = prevWonLeads.reduce((acc, l) => acc + Number(l.salesValue || 0), 0);

      const prevCpl = prevTotalLeads > 0 ? Math.round(prevSpend / prevTotalLeads) : null;
      const prevConvRate =
        prevTotalLeads > 0 ? Math.round((prevWonCount / prevTotalLeads) * 1000) / 10 : null;
      const prevRoas = prevSpend > 0 ? Math.round((prevRevenue / prevSpend) * 100) / 100 : null;
      const prevCac = prevWonCount > 0 ? Math.round(prevSpend / prevWonCount) : null;

      totalSpendChangePercentage = calcPercentageChange(totalSpend, prevSpend);
      totalLeadsChangePercentage = calcPercentageChange(totalLeads, prevTotalLeads);
      cplChangePercentage = calcPercentageChange(cpl, prevCpl);
      conversionRateChangePercentage = calcPercentageChange(conversionRate, prevConvRate);
      roasChangePercentage = calcPercentageChange(roas, prevRoas);
      cacChangePercentage = calcPercentageChange(cac, prevCac);
    }

    const kpis: ExecutiveKpiSummary = {
      totalSpend,
      totalSpendChangePercentage,
      totalSpendTargetProgress,
      totalLeads,
      totalLeadsChangePercentage,
      totalLeadsTargetProgress,
      cpl,
      cplChangePercentage,
      conversionRate,
      conversionRateChangePercentage,
      roas,
      roasChangePercentage,
      cac,
      cacChangePercentage,
      totalRevenue,
      wonCustomersCount,
      approvedBudget,
    };

    // 9. Two Independent Trend Charts (Spend Trend & Lead Trend)
    const { spendTrend, leadTrend } = this.computeIndependentTrends(
      realizedCosts,
      leads,
      fromDate,
      toDate,
      now,
    );

    // 10. Exact 5-Stage Conversion Funnel: Clicks -> Leads -> Qualified -> Proposal -> Customer
    const funnel = this.computeFunnel(leads, wonCustomersCount);

    // 11. Platform Share Chart from Database
    const platformShares = this.computePlatformShares(
      allOrgPlatforms,
      realizedCosts,
      totalSpend,
    );

    // 12. Campaign Performance Table
    const campaignItems = this.computeCampaignTable(campaigns, realizedCosts, leads);

    // 13. Alerts (Documented conditions: spend > budget, uncontacted lead > 24 hours)
    const alerts = this.computeAlerts(campaigns, campaignItems, leads, now);

    return {
      dateRange: {
        preset: query.preset || '30d',
        from: fromIso,
        to: toIso,
        comparePrevious,
        previousFrom: prevFromDate ? prevFromDate.toISOString().split('T')[0] : undefined,
        previousTo: prevToDate ? prevToDate.toISOString().split('T')[0] : undefined,
      },
      kpis,
      spendTrend,
      leadTrend,
      funnel,
      platformShares,
      campaigns: campaignItems,
      alerts,
      filters: {
        availableCampaigns: allOrgCampaigns,
        availablePlatforms: allOrgPlatforms.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
        })),
      },
      isMockData: false,
      generatedAt: now.toISOString(),
    };
  }

  /**
   * Computes two independent time-series: spend trend and lead trend
   */
  private computeIndependentTrends(
    realizedCosts: any[],
    leads: any[],
    fromDate: Date | undefined,
    toDate: Date | undefined,
    now: Date,
  ): { spendTrend: SpendTrendPoint[]; leadTrend: LeadTrendPoint[] } {
    const msInDay = 86400000;
    const spendTrend: SpendTrendPoint[] = [];
    const leadTrend: LeadTrendPoint[] = [];

    let startMs: number;
    let endMs: number;

    if (fromDate && toDate) {
      startMs = fromDate.getTime();
      endMs = toDate.getTime();
    } else {
      endMs = now.getTime();
      startMs = endMs - 14 * msInDay;
    }

    const totalDays = Math.min(60, Math.max(1, Math.round((endMs - startMs) / msInDay)));

    for (let i = 0; i < totalDays; i++) {
      const currentDay = new Date(startMs + i * msInDay);
      const isoDate = currentDay.toISOString().split('T')[0];

      let label = isoDate;
      try {
        label = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          day: 'numeric',
          month: 'short',
          timeZone: 'Asia/Tehran',
        }).format(currentDay);
      } catch {
        label = isoDate;
      }

      // Daily spend
      const dayCosts = realizedCosts.filter((c) => {
        const cDate =
          c.date instanceof Date
            ? c.date.toISOString().split('T')[0]
            : String(c.date).split('T')[0];
        return cDate === isoDate;
      });
      const daySpend = dayCosts.reduce((acc, c) => acc + Number(c.amount || 0), 0);

      // Daily leads
      const dayLeads = leads.filter((l) => {
        const lDate =
          l.createdAt instanceof Date
            ? l.createdAt.toISOString().split('T')[0]
            : String(l.createdAt).split('T')[0];
        return lDate === isoDate;
      });

      spendTrend.push({ date: isoDate, label, spend: daySpend });
      leadTrend.push({ date: isoDate, label, leadsCount: dayLeads.length });
    }

    return { spendTrend, leadTrend };
  }

  /**
   * Exact 5-stage conversion funnel: Clicks -> Leads -> Qualified -> Proposal -> Customer
   * - Clicks: Unavailable (null) - no authoritative click-event tracking ledger exists.
   * - Leads: Total genuine leads in date/campaign/tenant scope.
   * - Qualified: Strictly leads currently in 'qualified' status (non-overlapping).
   * - Proposal: Strictly leads currently in 'proposal' status (non-overlapping).
   * - Customer: Strictly won leads ('won' statusKey, counted uniquely once as won deals).
   */
  private computeFunnel(
    leads: any[],
    wonCustomersCount: number,
  ): FunnelStage[] {
    const totalLeads = leads.length;

    // Strict non-overlapping counts:
    const qualifiedCount = leads.filter((l) => l.statusKey === 'qualified').length;
    const proposalCount = leads.filter((l) => l.statusKey === 'proposal').length;
    const customerCount = wonCustomersCount; // leads with statusKey === 'won'

    const calcRate = (num: number, den: number): number | null => {
      if (den <= 0 || !isFinite(den)) return null;
      return Math.round((num / den) * 1000) / 10;
    };

    const clicksStage: FunnelStage = {
      id: 'clicks',
      label: 'کلیک روی لینک (Clicks)',
      count: null, // Unavailable - no authoritative click tracking table
      conversionFromPrevious: null,
      dropoffPercentage: null,
      isAvailable: false,
    };

    const leadsStage: FunnelStage = {
      id: 'leads',
      label: 'ثبت سرنخ (Leads)',
      count: totalLeads,
      conversionFromPrevious: null, // Cannot compute conversion from unavailable clicks
      dropoffPercentage: null,
      isAvailable: true,
    };

    const qualifiedConv = calcRate(qualifiedCount, totalLeads);
    const qualifiedStage: FunnelStage = {
      id: 'qualified',
      label: 'واجد شرایط (Qualified)',
      count: qualifiedCount,
      conversionFromPrevious: qualifiedConv,
      dropoffPercentage:
        qualifiedConv !== null ? Math.max(0, Math.round((100 - qualifiedConv) * 10) / 10) : null,
      isAvailable: true,
    };

    const proposalConv = calcRate(proposalCount, qualifiedCount);
    const proposalStage: FunnelStage = {
      id: 'proposal',
      label: 'پیشنهاد قیمت (Proposal)',
      count: proposalCount,
      conversionFromPrevious: proposalConv,
      dropoffPercentage:
        proposalConv !== null ? Math.max(0, Math.round((100 - proposalConv) * 10) / 10) : null,
      isAvailable: true,
    };

    const customerConv = calcRate(customerCount, proposalCount);
    const customerStage: FunnelStage = {
      id: 'customer',
      label: 'مشتری نهایی (Won Customers)',
      count: customerCount,
      conversionFromPrevious: customerConv,
      dropoffPercentage:
        customerConv !== null ? Math.max(0, Math.round((100 - customerConv) * 10) / 10) : null,
      isAvailable: true,
    };

    return [clicksStage, leadsStage, qualifiedStage, proposalStage, customerStage];
  }

  /**
   * Computes platform share distribution based on genuine database Platform records
   */
  private computePlatformShares(
    allPlatforms: any[],
    realizedCosts: any[],
    totalSpend: number,
  ): PlatformShareItem[] {
    const unlinkedSpend = realizedCosts
      .filter((c) => !c.platformId)
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);

    if (!allPlatforms || allPlatforms.length === 0) {
      if (unlinkedSpend > 0) {
        return [
          {
            id: 'unlinked',
            name: 'هزینه‌های ثبت‌شده بدون انتساب پلتفرم',
            code: 'unattributed',
            category: 'other',
            spend: unlinkedSpend,
            sharePercentage: 100,
          },
        ];
      }
      return [];
    }

    const items: PlatformShareItem[] = [];

    for (const plat of allPlatforms) {
      const platCosts = realizedCosts.filter((c) => c.platformId === plat.id);
      const platSpend = platCosts.reduce((acc, c) => acc + Number(c.amount || 0), 0);
      const sharePercentage =
        totalSpend > 0 ? Math.round((platSpend / totalSpend) * 100) : 0;

      items.push({
        id: plat.id,
        name: plat.name,
        code: plat.code,
        category: plat.category,
        spend: platSpend,
        sharePercentage,
      });
    }

    if (unlinkedSpend > 0) {
      items.push({
        id: 'unlinked',
        name: 'هزینه‌های ثبت‌شده بدون انتساب پلتفرم',
        code: 'unattributed',
        category: 'other',
        spend: unlinkedSpend,
        sharePercentage: totalSpend > 0 ? Math.round((unlinkedSpend / totalSpend) * 100) : 0,
      });
    }

    return items;
  }

  /**
   * Computes the documented Campaign Performance Table
   */
  private computeCampaignTable(
    campaigns: any[],
    realizedCosts: any[],
    leads: any[],
  ): DashboardCampaignItem[] {
    return campaigns.map((camp) => {
      // Costs linked to this campaign in the date range
      const campCosts = realizedCosts.filter((c) => c.campaignId === camp.id);
      const campSpend = campCosts.reduce((acc, c) => acc + Number(c.amount || 0), 0);

      // Leads linked to this campaign in the date range
      const campLeads = leads.filter((l) => l.campaignId === camp.id);
      const campWonLeads = campLeads.filter((l) => l.statusKey === 'won');

      const leadsCount = campLeads.length;
      const cpl = leadsCount > 0 ? Math.round(campSpend / leadsCount) : null;
      const conversionRate =
        leadsCount > 0
          ? Math.round((campWonLeads.length / leadsCount) * 1000) / 10
          : null;

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        health: camp.health || 'healthy',
        spend: campSpend,
        leadsCount,
        cpl,
        conversionRate,
      };
    });
  }

  /**
   * Computes alerts strictly adhering to documented requirements
   */
  private computeAlerts(
    campaigns: any[],
    campaignItems: DashboardCampaignItem[],
    leads: any[],
    now: Date,
  ): DashboardAlertItem[] {
    const alerts: DashboardAlertItem[] = [];

    // 1. Campaign Budget Warning: Spend > Budget (Page 9 requirement: "ردیف با هزینه بیش از بودجه: نشان هشدار")
    for (const camp of campaigns) {
      const budget = Number(camp.budget || 0);
      const item = campaignItems.find((i) => i.id === camp.id);
      const spend = item?.spend || 0;

      if (budget > 0 && spend > budget) {
        alerts.push({
          id: `alert-budget-${camp.id}`,
          severity: 'warning',
          source: 'budget',
          title: `مصرف مازاد بودجه در کمپین «${camp.name}»`,
          description: `هزینه ثبتی (${spend.toLocaleString('fa-IR')} تومان) از بودجه مصوب (${budget.toLocaleString('fa-IR')} تومان) فراتر رفته است.`,
          campaignId: camp.id,
          campaignName: camp.name,
          actionLabel: 'ساخت تسک',
          actionType: 'create_task',
          createdAt: now.toISOString(),
        });
      }
    }

    // 2. Unfollowed New Leads: Status 'new' for more than 24 hours (Page 15 requirement: "لید «جدید» بیش از ۲۴ ساعت: نشان هشدار")
    const msIn24Hours = 24 * 3600 * 1000;
    const cutoff24h = new Date(now.getTime() - msIn24Hours);

    const staleNewLead = leads.find((l) => {
      const createdAt = new Date(l.createdAt);
      return l.statusKey === 'new' && createdAt <= cutoff24h;
    });

    if (staleNewLead) {
      alerts.push({
        id: `alert-lead-stale-${staleNewLead.id}`,
        severity: 'critical',
        source: 'lead',
        title: 'سرنخ جدید بدون پیگیری اولیه (بیش از ۲۴ ساعت)',
        description: `سرنخ «${staleNewLead.fullName}» بیش از ۲۴ ساعت است که در سیستم ثبت شده و اقدام اولیه تماسی برای آن ثبت نگردیده است.`,
        actionLabel: 'ساخت تسک',
        actionType: 'create_task',
        createdAt: now.toISOString(),
      });
    }

    // Default info alert if no alerts exist
    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-default-healthy',
        severity: 'info',
        source: 'campaign',
        title: 'شاخص‌های اجرایی و کمپین‌ها در وضعیت عادی هستند',
        description: 'هیچ انحراف منفی بودجه یا لید معوقه بالای ۲۴ ساعت در سازمان مشاهده نشد.',
        actionLabel: 'مشاهده کمپین‌ها',
        actionType: 'navigate',
        actionHref: '/campaigns',
        createdAt: now.toISOString(),
      });
    }

    return alerts;
  }
}
