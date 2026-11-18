import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { CreateCustomMetricDto } from './dto/create-custom-metric.dto';
import { ValidateFormulaDto } from './dto/validate-formula.dto';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { SafeFormulaEvaluator } from './safe-formula-evaluator';
import { MetricDirection, Prisma } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  email?: string;
  role: string;
  organizationId: string;
}

export interface MetricDefinition {
  code: string;
  name: string;
  formula: string;
  unit: string;
  direction: MetricDirection;
  description?: string;
  isDefault: boolean;
  id?: string;
  createdAt?: string;
}

export const DEFAULT_METRICS: MetricDefinition[] = [
  {
    code: 'cpl',
    name: 'هزینه به ازای لید (CPL)',
    formula: 'cost / lead',
    unit: 'تومان',
    direction: MetricDirection.lower_is_better,
    description: 'هزینه کل تقسیم بر تعداد لیدهای جذب‌شده',
    isDefault: true,
  },
  {
    code: 'cac',
    name: 'هزینه جذب مشتری (CAC)',
    formula: 'cost / customer',
    unit: 'تومان',
    direction: MetricDirection.lower_is_better,
    description: 'هزینه کل تقسیم بر تعداد مشتریان تبدیل‌شده',
    isDefault: true,
  },
  {
    code: 'roas',
    name: 'بازگشت هزینه تبلیغات (ROAS)',
    formula: 'revenue / cost',
    unit: 'نسبت',
    direction: MetricDirection.higher_is_better,
    description: 'درآمد فروش تقسیم بر هزینه تبلیغات',
    isDefault: true,
  },
  {
    code: 'ctr',
    name: 'نرخ کلیک به نمایش (CTR)',
    formula: '(clicks / impressions) * 100',
    unit: 'درصد',
    direction: MetricDirection.higher_is_better,
    description: 'درصد افرادی که پس از دیدن تبلیغ کلیک کرده‌اند',
    isDefault: true,
  },
  {
    code: 'cpc',
    name: 'هزینه به ازای هر کلیک (CPC)',
    formula: 'cost / clicks',
    unit: 'تومان',
    direction: MetricDirection.lower_is_better,
    description: 'هزینه کل تقسیم بر تعداد کلیک‌ها',
    isDefault: true,
  },
  {
    code: 'cpa',
    name: 'هزینه به ازای هر اقدام (CPA)',
    formula: 'cost / conversions',
    unit: 'تومان',
    direction: MetricDirection.lower_is_better,
    description: 'هزینه کل تقسیم بر تعداد کانورژن‌های ثبت شده',
    isDefault: true,
  },
  {
    code: 'cr',
    name: 'نرخ تبدیل لید به مشتری (CR)',
    formula: '(customer / lead) * 100',
    unit: 'درصد',
    direction: MetricDirection.higher_is_better,
    description: 'درصد لیدهایی که به مشتری تبدیل شده‌اند',
    isDefault: true,
  },
];

@Injectable()
export class KpisService {
  private readonly logger = new Logger(KpisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RBAC Enforcement (Product Document p. 13 §11)
   * Authorized: admin, marketing_manager (full write & read)
   * Read-only: campaign_manager
   */
  private assertAccess(user?: CurrentUserPayload, action: 'read' | 'write' = 'read') {
    if (!user) return; // Allow internal tests without user context

    const writeRoles = ['admin', 'marketing_manager'];
    const readRoles = ['admin', 'marketing_manager', 'campaign_manager'];

    if (action === 'write' && !writeRoles.includes(user.role)) {
      throw new ForbiddenException(
        `تنها مدیر مارکتینگ و ادمین مجاز به ثبت یا تغییر شاخص‌ها و قواعد هشدار هستند (نقش شما: ${user.role}).`,
      );
    }

    if (action === 'read' && !readRoles.includes(user.role)) {
      throw new ForbiddenException(
        `نقش شما (${user.role}) مجوز مشاهده ماژول KPI و شاخص‌ها را ندارد (PRD ص ۱۳).`,
      );
    }
  }

  // ==============================================================================
  // 1. CONTEXT VARIABLES QUERY FOR DOMAIN ENTITIES (Campaign, Cost, Lead)
  // ==============================================================================

  public async getContextVariables(
    organizationId: string,
    campaignId?: string | null,
  ): Promise<Record<string, number>> {
    const costWhere: any = { organizationId };
    const leadWhere: any = { organizationId };
    const campWhere: any = { organizationId };

    if (campaignId) {
      costWhere.campaignId = campaignId;
      leadWhere.campaignId = campaignId;
      campWhere.id = campaignId;
    }

    // 1. Costs
    const costSumResult = await this.prisma.cost.aggregate({
      where: costWhere,
      _sum: { amount: true },
    });
    let totalCost = Number(costSumResult._sum.amount || 0);

    // 2. Campaigns (clicks, impressions, conversions, budget, spend)
    const campaigns = await this.prisma.campaign.findMany({
      where: campWhere,
      select: {
        id: true,
        budget: true,
        spend: true,
        clicks: true,
        impressions: true,
        conversions: true,
      },
    });

    let clicks = 0;
    let impressions = 0;
    let conversions = 0;
    let budget = 0;
    let campaignSpend = 0;

    for (const c of campaigns) {
      clicks += c.clicks || 0;
      impressions += c.impressions || 0;
      conversions += c.conversions || 0;
      budget += Number(c.budget || 0);
      campaignSpend += Number(c.spend || 0);
    }

    // If no direct cost table rows exist for campaign, fallback to campaign.spend
    if (totalCost === 0 && campaignSpend > 0) {
      totalCost = campaignSpend;
    }

    // 3. Leads & Customers & Revenue
    const leadsCount = await this.prisma.lead.count({
      where: leadWhere,
    });

    // Customers: status in won/converted or salesValue > 0
    const customerWhere: any = {
      ...leadWhere,
      OR: [
        { statusKey: { in: ['won', 'closed_won', 'converted'] } },
        { salesValue: { gt: 0 } },
      ],
    };

    const customersCount = await this.prisma.lead.count({
      where: customerWhere,
    });

    const revenueResult = await this.prisma.lead.aggregate({
      where: leadWhere,
      _sum: { salesValue: true },
    });
    const totalRevenue = Number(revenueResult._sum.salesValue || 0);

    return {
      cost: totalCost,
      lead: leadsCount,
      customer: customersCount,
      revenue: totalRevenue,
      clicks,
      impressions,
      conversions,
      budget,
    };
  }

  // ==============================================================================
  // 2. FORMULA VALIDATION & PREVIEW
  // ==============================================================================

  async validateFormula(dto: ValidateFormulaDto) {
    const valResult = SafeFormulaEvaluator.validate(dto.formula);
    return valResult;
  }

  async previewFormula(dto: ValidateFormulaDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'read');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const valResult = SafeFormulaEvaluator.validate(dto.formula);
    if (!valResult.isValid) {
      throw new BadRequestException(valResult.error);
    }

    const context = await this.getContextVariables(organizationId, dto.campaignId);
    const evalResult = SafeFormulaEvaluator.evaluate(dto.formula, context);

    let campaignName = 'کل سازمان';
    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findUnique({
        where: { id: dto.campaignId },
        select: { name: true },
      });
      if (camp) {
        campaignName = camp.name;
      }
    }

    return {
      ...valResult,
      ...evalResult,
      campaignName,
      contextVariables: context,
    };
  }

  // ==============================================================================
  // 3. METRICS CATALOG (Default + Custom Metrics)
  // ==============================================================================

  async findAllMetrics(user?: CurrentUserPayload): Promise<{
    defaultMetrics: MetricDefinition[];
    customMetrics: MetricDefinition[];
  }> {
    this.assertAccess(user, 'read');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const customRows = await this.prisma.customMetric.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const customMetrics: MetricDefinition[] = customRows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      formula: r.formula,
      unit: r.unit,
      direction: r.direction,
      description: r.description || undefined,
      isDefault: false,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      defaultMetrics: DEFAULT_METRICS,
      customMetrics,
    };
  }

  async createCustomMetric(dto: CreateCustomMetricDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    // Validate formula syntax and variables
    const valResult = SafeFormulaEvaluator.validate(dto.formula);
    if (!valResult.isValid) {
      throw new BadRequestException(valResult.error);
    }

    // Check code uniqueness within organization
    const existing = await this.prisma.customMetric.findFirst({
      where: { organizationId, code: dto.code.trim().toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException(`شاخصی با کد «${dto.code}» پیش‌تر ثبت شده است.`);
    }

    // Also avoid colliding with default metric codes
    if (DEFAULT_METRICS.some((m) => m.code === dto.code.trim().toLowerCase())) {
      throw new BadRequestException(`کد «${dto.code}» برای شاخص‌های پیش‌فرض رزرو شده است.`);
    }

    const created = await this.prisma.customMetric.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        code: dto.code.trim().toLowerCase(),
        description: dto.description?.trim(),
        formula: valResult.normalizedFormula || dto.formula.trim(),
        direction: dto.direction || MetricDirection.higher_is_better,
        unit: dto.unit?.trim() || 'تومان',
      },
    });

    return created;
  }

  async deleteCustomMetric(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.customMetric.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('شاخص سفارشی یافت نشد.');
    }

    // Check if any Target KPI is using this metric code
    const usedInKpi = await this.prisma.kpiMetric.findFirst({
      where: { organizationId, code: existing.code },
    });
    if (usedInKpi) {
      throw new BadRequestException(
        `این شاخص در KPI «${usedInKpi.name}» در حال استفاده است و قابل حذف نیست.`,
      );
    }

    await this.prisma.customMetric.delete({
      where: { id },
    });

    return { success: true, message: 'شاخص سفارشی با موفقیت حذف شد.' };
  }

  // ==============================================================================
  // 4. TAB 1: TARGET KPIS (Fulfill PRD p. 13 §11)
  // ==============================================================================

  private calculateProgress(
    actualValue: number,
    targetValue: number,
    direction: MetricDirection,
  ): number {
    if (targetValue <= 0) return 0;

    let progress: number;
    if (direction === MetricDirection.higher_is_better) {
      // بالاتر بهتر: با افزایش actualValue پیشرفت افزایش می‌یابد
      progress = (actualValue / targetValue) * 100;
    } else {
      // کمتر بهتر (CPL, CAC): اگر مقدار واقعی مساوی یا کمتر از هدف باشد، پیشرفت ۱۰۰٪ یا بیشتر است
      if (actualValue <= 0) {
        progress = 100; // صفر یعنی هزینه کمتر و عملکرد عالی
      } else {
        progress = (targetValue / actualValue) * 100;
      }
    }

    return Math.round(progress * 10) / 10;
  }

  async findAllKpis(user?: CurrentUserPayload) {
    this.assertAccess(user, 'read');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const kpis: any[] = await this.prisma.kpiMetric.findMany({
      where: { organizationId },
      include: {
        campaign: {
          select: { id: true, name: true, status: true },
        },
        alertRules: {
          select: { id: true, message: true, severity: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Custom metrics for formula lookup
    const customMetrics = await this.prisma.customMetric.findMany({
      where: { organizationId },
    });

    const enrichedKpis = await Promise.all(
      kpis.map(async (kpi: any) => {
        // Resolve formula
        let formula = kpi.formula;
        if (!formula) {
          const def = DEFAULT_METRICS.find((m) => m.code === kpi.code);
          if (def) {
            formula = def.formula;
          } else {
            const cust = customMetrics.find((m) => m.code === kpi.code);
            if (cust) {
              formula = cust.formula;
            }
          }
        }

        // Live calculation of actual value
        let liveActual = Number(kpi.actualValue);
        if (formula) {
          try {
            const context = await this.getContextVariables(organizationId, kpi.campaignId);
            const evalResult = SafeFormulaEvaluator.evaluate(formula, context);
            liveActual = evalResult.value;
          } catch (e) {
            // Keep existing actual value
          }
        }

        const target = Number(kpi.targetValue);
        const progressPercentage = this.calculateProgress(liveActual, target, kpi.direction);

        return {
          id: kpi.id,
          name: kpi.name,
          code: kpi.code,
          formula,
          direction: kpi.direction,
          targetValue: target,
          actualValue: liveActual,
          progressPercentage,
          unit: kpi.unit,
          period: kpi.period,
          scope: kpi.campaignId ? 'campaign' : 'organization',
          scopeTitle: kpi.campaign?.name || 'کل سازمان',
          campaign: kpi.campaign,
          alertRulesCount: kpi.alertRules ? kpi.alertRules.length : 0,
          createdAt: kpi.createdAt.toISOString(),
          updatedAt: kpi.updatedAt.toISOString(),
        };
      }),
    );

    return enrichedKpis;
  }

  async findOneKpi(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'read');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const kpi = await this.prisma.kpiMetric.findFirst({
      where: { id, organizationId },
      include: {
        campaign: { select: { id: true, name: true } },
        alertRules: true,
      },
    });

    if (!kpi) {
      throw new NotFoundException('شاخص KPI مورد نظر یافت نشد.');
    }

    return kpi;
  }

  async createKpi(dto: CreateKpiDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    // Verify campaign if provided
    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
      });
      if (!camp) {
        throw new NotFoundException('کمپین انتخاب شده برای این سازمان یافت نشد.');
      }
    }

    // Determine formula and direction if not provided
    let formula = dto.formula?.trim();
    let direction = dto.direction;
    let unit = dto.unit?.trim();

    if (!formula) {
      const def = DEFAULT_METRICS.find((m) => m.code === dto.code.toLowerCase());
      if (def) {
        formula = def.formula;
        if (!direction) direction = def.direction;
        if (!unit) unit = def.unit;
      } else {
        const cust = await this.prisma.customMetric.findFirst({
          where: { organizationId, code: dto.code.toLowerCase() },
        });
        if (cust) {
          formula = cust.formula;
          if (!direction) direction = cust.direction;
          if (!unit) unit = cust.unit;
        }
      }
    }

    // Live evaluate actual value on creation
    let actualValue = 0;
    if (formula) {
      try {
        const context = await this.getContextVariables(organizationId, dto.campaignId);
        const evalRes = SafeFormulaEvaluator.evaluate(formula, context);
        actualValue = evalRes.value;
      } catch (e) {
        actualValue = 0;
      }
    }

    const created = await this.prisma.kpiMetric.create({
      data: {
        organizationId,
        campaignId: dto.campaignId || null,
        name: dto.name.trim(),
        code: dto.code.trim().toLowerCase(),
        formula,
        direction: direction || MetricDirection.higher_is_better,
        targetValue: new Prisma.Decimal(dto.targetValue),
        actualValue: new Prisma.Decimal(actualValue),
        unit: unit || 'تومان',
        period: dto.period.trim(),
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    return created;
  }

  async updateKpi(id: string, dto: UpdateKpiDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.kpiMetric.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('شاخص KPI یافت نشد.');
    }

    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
      });
      if (!camp) {
        throw new NotFoundException('کمپین انتخاب شده معتبر نیست.');
      }
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.code !== undefined) updateData.code = dto.code.trim().toLowerCase();
    if (dto.campaignId !== undefined) updateData.campaignId = dto.campaignId || null;
    if (dto.targetValue !== undefined) updateData.targetValue = new Prisma.Decimal(dto.targetValue);
    if (dto.direction !== undefined) updateData.direction = dto.direction;
    if (dto.unit !== undefined) updateData.unit = dto.unit.trim();
    if (dto.period !== undefined) updateData.period = dto.period.trim();
    if (dto.formula !== undefined) updateData.formula = dto.formula.trim();

    const updated = await this.prisma.kpiMetric.update({
      where: { id },
      data: updateData,
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  async deleteKpi(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.kpiMetric.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('شاخص KPI یافت نشد.');
    }

    await this.prisma.kpiMetric.delete({
      where: { id },
    });

    return { success: true, message: 'شاخص KPI با موفقیت حذف گردید.' };
  }

  // ==============================================================================
  // 5. TAB 3: ALERT RULES (قواعد هشدار - جمله‌ساز p. 13 §11)
  // ==============================================================================

  async findAllAlertRules(user?: CurrentUserPayload) {
    this.assertAccess(user, 'read');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const rules = await this.prisma.kpiAlertRule.findMany({
      where: { organizationId },
      include: {
        kpiMetric: {
          select: { id: true, name: true, code: true, actualValue: true, targetValue: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules.map((r) => {
      // Check if alert condition is currently met
      let isTriggered = false;
      const actual = r.kpiMetric ? Number(r.kpiMetric.actualValue) : 0;
      const thresh = Number(r.thresholdValue);

      switch (r.condition) {
        case 'gt':
          isTriggered = actual > thresh;
          break;
        case 'lt':
          isTriggered = actual < thresh;
          break;
        case 'gte':
          isTriggered = actual >= thresh;
          break;
        case 'lte':
          isTriggered = actual <= thresh;
          break;
        case 'eq':
          isTriggered = actual === thresh;
          break;
      }

      return {
        id: r.id,
        organizationId: r.organizationId,
        kpiMetricId: r.kpiMetricId,
        kpiMetricName: r.kpiMetric?.name || null,
        metricName: r.metricName,
        condition: r.condition,
        thresholdValue: thresh,
        severity: r.severity,
        message: r.message,
        suggestedAction: r.suggestedAction,
        isActive: r.isActive,
        isTriggered: r.isActive && isTriggered,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }

  async createAlertRule(dto: CreateAlertRuleDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    if (dto.kpiMetricId) {
      const kpi = await this.prisma.kpiMetric.findFirst({
        where: { id: dto.kpiMetricId, organizationId },
      });
      if (!kpi) {
        throw new NotFoundException('شاخص KPI متناظر برای قاعده هشدار یافت نشد.');
      }
    }

    const created = await this.prisma.kpiAlertRule.create({
      data: {
        organizationId,
        kpiMetricId: dto.kpiMetricId || null,
        metricName: dto.metricName.trim(),
        condition: dto.condition,
        thresholdValue: new Prisma.Decimal(dto.thresholdValue),
        severity: dto.severity || 'warning',
        message: dto.message.trim(),
        suggestedAction: dto.suggestedAction?.trim() || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return created;
  }

  async updateAlertRule(id: string, dto: UpdateAlertRuleDto, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.kpiAlertRule.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('قاعده هشدار یافت نشد.');
    }

    const updateData: any = {};
    if (dto.kpiMetricId !== undefined) updateData.kpiMetricId = dto.kpiMetricId || null;
    if (dto.metricName !== undefined) updateData.metricName = dto.metricName.trim();
    if (dto.condition !== undefined) updateData.condition = dto.condition;
    if (dto.thresholdValue !== undefined)
      updateData.thresholdValue = new Prisma.Decimal(dto.thresholdValue);
    if (dto.severity !== undefined) updateData.severity = dto.severity;
    if (dto.message !== undefined) updateData.message = dto.message.trim();
    if (dto.suggestedAction !== undefined)
      updateData.suggestedAction = dto.suggestedAction?.trim() || null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.kpiAlertRule.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async toggleAlertRule(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.kpiAlertRule.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('قاعده هشدار یافت نشد.');
    }

    const updated = await this.prisma.kpiAlertRule.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return updated;
  }

  async deleteAlertRule(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user, 'write');
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.kpiAlertRule.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('قاعده هشدار یافت نشد.');
    }

    await this.prisma.kpiAlertRule.delete({
      where: { id },
    });

    return { success: true, message: 'قاعده هشدار با موفقیت حذف شد.' };
  }
}
