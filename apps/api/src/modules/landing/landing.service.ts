import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { CreateUtmLinkDto } from './dto/create-utm-link.dto';
import { PreviewUtmDto } from './dto/preview-utm.dto';
import { UtmUrlBuilder } from './utm-url-builder';
import { PREDEFINED_PLATFORM_TEMPLATES } from '../platforms/constants/platform-templates';

export interface CurrentUserPayload {
  id: string;
  email?: string;
  role: string;
  organizationId: string;
}

export interface LandingPageResponse {
  id: string;
  title: string;
  url: string;
  connectionStatus: boolean;
  connectionStatusText: string;
  isWordPressConnected: boolean;
  totalLeads: number;
  recent7DaysLeads: number;
  lastLeadDate: string | null;
  has30DayNoLeadWarning: boolean;
  inactivityStatus?: 'active' | 'inactive_30_days' | 'insufficient_history';
  campaignId: string | null;
  campaignName: string | null;
  utmLinksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UtmLinkResponse {
  id: string;
  finalUrl: string;
  originalUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string | null;
  utmContent: string | null;
  clicksCount: number;
  isClickTrackingActive: boolean;
  clickTrackingNotice: string;
  attributedLeadsCount: number;
  landingPageId: string | null;
  landingPageTitle: string | null;
  campaignId: string | null;
  campaignName: string | null;
  platformId: string | null;
  platformName: string | null;
  createdAt: string;
}

const COMMON_MEDIUMS = [
  { key: 'cpc', label: 'کلیکی (cpc)' },
  { key: 'banner', label: 'بنر (banner)' },
  { key: 'story', label: 'استوری (story)' },
  { key: 'post', label: 'پست (post)' },
  { key: 'sms', label: 'پیامک (sms)' },
  { key: 'email', label: 'ایمیل (email)' },
  { key: 'social', label: 'شبکه‌های اجتماعی (social)' },
  { key: 'influencer', label: 'اینفلوئنسر (influencer)' },
  { key: 'referral', label: 'ارجاعی (referral)' },
];

@Injectable()
export class LandingService {
  private readonly logger = new Logger(LandingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RBAC Enforcement (Product Document p. 14 §13)
   * Authorized: admin, marketing_manager, campaign_manager
   * Denied: sales_agent, content_creator, client
   */
  private assertAccess(user?: CurrentUserPayload) {
    if (!user) return; // Allow internal calls without context

    const allowedRoles = ['admin', 'marketing_manager', 'campaign_manager'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `نقش شما (${user.role}) مجوز دسترسی به ماژول لندینگ و UTM را ندارد (سند محصول ص ۱۴).`,
      );
    }
  }

  // ==============================================================================
  // 1. LANDING PAGES (جدول لندینگ‌ها - ص ۱۴)
  // ==============================================================================

  async findAllLandingPages(user?: CurrentUserPayload): Promise<LandingPageResponse[]> {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const landingPages = await this.prisma.landingPage.findMany({
      where: { organizationId },
      include: {
        campaign: { select: { id: true, name: true } },
        utmLinks: {
          select: {
            id: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            utmTerm: true,
            utmContent: true,
            campaignId: true,
            landingPageId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check WordPress integrations for this organization
    const wpIntegrations = await this.prisma.wordpressIntegration.findMany({
      where: { organizationId, isActive: true },
      select: { siteUrl: true },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // --------------------------------------------------------------------------
    // 1. DETERMINE CAMPAIGN AMBIGUITY
    // Count landing pages per campaign.
    // - If count === 1: The campaign-to-landing-page relationship is UNAMBIGUOUS.
    // - If count > 1: The campaign has MULTIPLE landing pages (AMBIGUOUS).
    //   In ambiguous campaigns, leads MUST NOT be attributed by campaignId alone,
    //   to prevent duplicate counting or arbitrary assignment.
    // --------------------------------------------------------------------------
    const campaignLpCount = new Map<string, number>();
    for (const lp of landingPages) {
      if (lp.campaignId) {
        campaignLpCount.set(lp.campaignId, (campaignLpCount.get(lp.campaignId) || 0) + 1);
      }
    }

    // --------------------------------------------------------------------------
    // 2. FETCH CANDIDATE LEADS
    // Fetch all leads belonging to this organization that have relevant campaign
    // or UTM parameters.
    // --------------------------------------------------------------------------
    const allCampaignIds = Array.from(campaignLpCount.keys());
    const allUtmConditions = landingPages.flatMap((lp) =>
      lp.utmLinks.map((utm) => ({
        utmSource: utm.utmSource,
        utmCampaign: utm.utmCampaign,
      })),
    );

    const orClauses: any[] = [];
    if (allCampaignIds.length > 0) {
      orClauses.push({ campaignId: { in: allCampaignIds } });
    }
    if (allUtmConditions.length > 0) {
      orClauses.push(...allUtmConditions);
    }

    const candidateLeads = orClauses.length > 0
      ? await this.prisma.lead.findMany({
          where: {
            organizationId,
            OR: orClauses,
          },
          select: {
            id: true,
            createdAt: true,
            campaignId: true,
            platformId: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            utmTerm: true,
            utmContent: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // --------------------------------------------------------------------------
    // 3. MULTI-TIER DETERMINISTIC LEAD ATTRIBUTION ENGINE
    // Rules:
    // - Tier 1 (Highest): Exact UTM matching against landingPage.utmLinks
    // - Tier 2: Unambiguous campaign matching (ONLY when campaign has exactly 1 landing page)
    // - Ambiguous campaigns without matching UTM remain unassigned (no arbitrary assignment)
    // - Strict isolation: Each lead can belong to AT MOST ONE landing page (no double-counting)
    // --------------------------------------------------------------------------
    const lpAttributedLeadsMap = new Map<string, Array<{ id: string; createdAt: Date }>>();
    for (const lp of landingPages) {
      lpAttributedLeadsMap.set(lp.id, []);
    }

    const attributedLeadIds = new Set<string>();

    // Pass 1: Tier 1 - Exact UTM link matching
    for (const lead of candidateLeads) {
      if (!lead.utmSource || !lead.utmCampaign) continue;

      for (const lp of landingPages) {
        // Find if this landing page owns a UTM link that matches this lead
        const matchingUtm = lp.utmLinks.find((utm) => {
          // Source and campaign must match (case-insensitive)
          const srcMatch = utm.utmSource.toLowerCase() === lead.utmSource?.toLowerCase();
          const campMatch = utm.utmCampaign.toLowerCase() === lead.utmCampaign?.toLowerCase();
          if (!srcMatch || !campMatch) return false;

          // If UTM link specifies medium, verify medium match
          if (utm.utmMedium && lead.utmMedium) {
            if (utm.utmMedium.toLowerCase() !== lead.utmMedium.toLowerCase()) return false;
          }

          // If UTM link specifies term, verify term match
          if (utm.utmTerm && lead.utmTerm) {
            if (utm.utmTerm.toLowerCase() !== lead.utmTerm.toLowerCase()) return false;
          }

          // If UTM link specifies content, verify content match
          if (utm.utmContent && lead.utmContent) {
            if (utm.utmContent.toLowerCase() !== lead.utmContent.toLowerCase()) return false;
          }

          // If UTM link has campaignId and lead has campaignId, they should match
          if (utm.campaignId && lead.campaignId) {
            if (utm.campaignId !== lead.campaignId) return false;
          }

          return true;
        });

        if (matchingUtm) {
          lpAttributedLeadsMap.get(lp.id)!.push({ id: lead.id, createdAt: lead.createdAt });
          attributedLeadIds.add(lead.id);
          break; // Lead attributed to this LP, move to next lead
        }
      }
    }

    // Pass 2: Tier 2 - Unambiguous Campaign Matching
    // For leads not matched by UTM: if their campaignId has EXACTLY 1 landing page, attribute to it.
    for (const lead of candidateLeads) {
      if (attributedLeadIds.has(lead.id)) continue;
      if (!lead.campaignId) continue;

      const lpCount = campaignLpCount.get(lead.campaignId) || 0;
      if (lpCount === 1) {
        // Unambiguous: find the single LP for this campaign
        const targetLp = landingPages.find((lp) => lp.campaignId === lead.campaignId);
        if (targetLp) {
          lpAttributedLeadsMap.get(targetLp.id)!.push({ id: lead.id, createdAt: lead.createdAt });
          attributedLeadIds.add(lead.id);
        }
      }
      // If lpCount > 1: Ambiguous relationship. The lead is NOT assigned to any LP arbitrarily.
    }

    // --------------------------------------------------------------------------
    // 4. METRICS & 30-DAY INACTIVITY CALCULATION FOR EACH LANDING PAGE
    // --------------------------------------------------------------------------
    const results: LandingPageResponse[] = [];

    for (const lp of landingPages) {
      // WordPress connection check
      let isWpConnected = false;
      try {
        const lpDomain = new URL(lp.url).origin.toLowerCase();
        isWpConnected = wpIntegrations.some((wp) => {
          try {
            return new URL(wp.siteUrl).origin.toLowerCase() === lpDomain;
          } catch {
            return false;
          }
        });
      } catch {
        isWpConnected = false;
      }

      const attributedLeads = lpAttributedLeadsMap.get(lp.id) || [];
      const totalLeads = attributedLeads.length;
      const recent7DaysLeads = attributedLeads.filter(
        (l) => new Date(l.createdAt) >= sevenDaysAgo,
      ).length;

      let lastLeadDate: Date | null = null;
      if (attributedLeads.length > 0) {
        lastLeadDate = attributedLeads.reduce((max, l) => {
          const d = new Date(l.createdAt);
          return d > max ? d : max;
        }, new Date(attributedLeads[0].createdAt));
      }

      // ------------------------------------------------------------------------
      // 30-Day Inactivity Warning & Inactivity Status
      // Scenarios:
      // 1. Created 90d ago, lead yesterday: lastLeadDate >= thirtyDaysAgo -> hasWarning: false (ACTIVE)
      // 2. Created 90d ago, last lead 35d ago: lastLeadDate < thirtyDaysAgo -> hasWarning: true (INACTIVE_30_DAYS)
      // 3. Created 10d ago, no leads: created < 30d ago -> hasWarning: false (INSUFFICIENT_HISTORY)
      // 4. Distinguish insufficient history (< 30d alive) from confirmed inactivity (>= 30d alive with no leads in trailing 30d)
      // ------------------------------------------------------------------------
      const isOlderThan30Days = new Date(lp.createdAt) < thirtyDaysAgo;
      let has30DayNoLeadWarning = false;
      let inactivityStatus: 'active' | 'inactive_30_days' | 'insufficient_history';

      if (lastLeadDate) {
        if (lastLeadDate >= thirtyDaysAgo) {
          has30DayNoLeadWarning = false;
          inactivityStatus = 'active';
        } else {
          has30DayNoLeadWarning = true;
          inactivityStatus = 'inactive_30_days';
        }
      } else {
        if (isOlderThan30Days) {
          has30DayNoLeadWarning = true;
          inactivityStatus = 'inactive_30_days';
        } else {
          has30DayNoLeadWarning = false;
          inactivityStatus = 'insufficient_history';
        }
      }

      const actualConnectionStatus = isWpConnected || totalLeads > 0 || lp.connectionStatus;
      const connectionStatusText = isWpConnected
        ? 'متصل به وردپرس'
        : totalLeads > 0
          ? 'فعال (دریافت لید)'
          : 'قطع / بدون وب‌هوک';

      results.push({
        id: lp.id,
        title: lp.title,
        url: lp.url,
        connectionStatus: actualConnectionStatus,
        connectionStatusText,
        isWordPressConnected: isWpConnected,
        totalLeads,
        recent7DaysLeads,
        lastLeadDate: lastLeadDate ? lastLeadDate.toISOString() : null,
        has30DayNoLeadWarning,
        inactivityStatus,
        campaignId: lp.campaignId,
        campaignName: lp.campaign?.name || null,
        utmLinksCount: lp.utmLinks.length,
        createdAt: lp.createdAt.toISOString(),
        updatedAt: lp.updatedAt.toISOString(),
      });
    }

    return results;
  }

  async createLandingPage(
    dto: CreateLandingPageDto,
    user?: CurrentUserPayload,
  ): Promise<LandingPageResponse> {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    // Validate HTTPS protocol
    const valResult = UtmUrlBuilder.validateDestinationUrl(dto.url);
    if (!valResult.isValid) {
      throw new BadRequestException(valResult.error);
    }

    // Verify campaign if provided
    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
      });
      if (!camp) {
        throw new NotFoundException('کمپین انتخاب‌شده یافت نشد.');
      }
    }

    // Check if domain matches an active WordPress integration
    let isWpConnected = false;
    try {
      const lpDomain = new URL(dto.url).origin.toLowerCase();
      const wp = await this.prisma.wordpressIntegration.findFirst({
        where: { organizationId, isActive: true },
      });
      if (wp) {
        isWpConnected = new URL(wp.siteUrl).origin.toLowerCase() === lpDomain;
      }
    } catch {
      isWpConnected = false;
    }

    const created = await this.prisma.landingPage.create({
      data: {
        organizationId,
        title: dto.title.trim(),
        url: dto.url.trim(),
        campaignId: dto.campaignId || null,
        connectionStatus: isWpConnected,
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    return {
      id: created.id,
      title: created.title,
      url: created.url,
      connectionStatus: isWpConnected,
      connectionStatusText: isWpConnected ? 'متصل به وردپرس' : 'قطع / بدون وب‌هوک',
      isWordPressConnected: isWpConnected,
      totalLeads: 0,
      recent7DaysLeads: 0,
      lastLeadDate: null,
      has30DayNoLeadWarning: false,
      campaignId: created.campaignId,
      campaignName: created.campaign?.name || null,
      utmLinksCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async deleteLandingPage(id: string, user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const existing = await this.prisma.landingPage.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('صفحه لندینگ مورد نظر یافت نشد.');
    }

    await this.prisma.landingPage.delete({
      where: { id },
    });

    return { success: true, message: 'صفحه لندینگ با موفقیت حذف شد.' };
  }

  // ==============================================================================
  // 2. UTM BUILDER & HISTORY (سازنده UTM و تاریخچه لینک‌ها - ص ۱۴)
  // ==============================================================================

  previewUtmLink(dto: PreviewUtmDto): { isValid: boolean; finalUrl: string } {
    try {
      const finalUrl = UtmUrlBuilder.build({
        destinationUrl: dto.destinationUrl,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmTerm: dto.utmTerm,
        utmContent: dto.utmContent,
      });

      return { isValid: true, finalUrl };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'خطا در تولید آدرس UTM');
    }
  }

  async findAllUtmLinks(user?: CurrentUserPayload): Promise<UtmLinkResponse[]> {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const links = await this.prisma.utmLink.findMany({
      where: { organizationId },
      include: {
        campaign: { select: { id: true, name: true } },
        platform: { select: { id: true, name: true, code: true } },
        landingPage: { select: { id: true, title: true, url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: UtmLinkResponse[] = [];

    for (const link of links) {
      // Attribute leads matching utmSource, utmCampaign and specific UTM tags
      const utmLeadWhere: any = {
        organizationId,
        utmSource: { equals: link.utmSource, mode: 'insensitive' },
        utmCampaign: { equals: link.utmCampaign, mode: 'insensitive' },
      };
      if (link.utmMedium) {
        utmLeadWhere.utmMedium = { equals: link.utmMedium, mode: 'insensitive' };
      }
      if (link.utmTerm) {
        utmLeadWhere.utmTerm = { equals: link.utmTerm, mode: 'insensitive' };
      }
      if (link.utmContent) {
        utmLeadWhere.utmContent = { equals: link.utmContent, mode: 'insensitive' };
      }

      const attributedLeadsCount = await this.prisma.lead.count({
        where: utmLeadWhere,
      });

      results.push({
        id: link.id,
        finalUrl: link.finalUrl,
        originalUrl: link.originalUrl,
        utmSource: link.utmSource,
        utmMedium: link.utmMedium,
        utmCampaign: link.utmCampaign,
        utmTerm: link.utmTerm,
        utmContent: link.utmContent,
        clicksCount: link.clicksCount,
        isClickTrackingActive: false,
        clickTrackingNotice: 'شمارش مستقیم کلیک نیاز به نصب اسکریپت ردیاب Gapji در صفحه فرود دارد.',
        attributedLeadsCount,
        landingPageId: link.landingPageId,
        landingPageTitle: link.landingPage?.title || null,
        campaignId: link.campaignId,
        campaignName: link.campaign?.name || null,
        platformId: link.platformId,
        platformName: link.platform?.name || link.utmSource,
        createdAt: link.createdAt.toISOString(),
      });
    }

    return results;
  }

  async createUtmLink(
    dto: CreateUtmLinkDto,
    user?: CurrentUserPayload,
  ): Promise<UtmLinkResponse> {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    let destinationUrl = dto.destinationUrl?.trim();
    let landingPageTitle: string | null = null;

    // If landingPageId provided, resolve destinationUrl from landing page
    if (dto.landingPageId) {
      const lp = await this.prisma.landingPage.findFirst({
        where: { id: dto.landingPageId, organizationId },
      });
      if (lp) {
        destinationUrl = lp.url;
        landingPageTitle = lp.title;
      }
    }

    // Generate and validate final UTM URL
    let finalUrl: string;
    try {
      finalUrl = UtmUrlBuilder.build({
        destinationUrl,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmTerm: dto.utmTerm,
        utmContent: dto.utmContent,
      });
    } catch (err: any) {
      throw new BadRequestException(err.message || 'خطا در ایجاد آدرس UTM');
    }

    // Verify campaign and platform if provided
    let campaignName: string | null = null;
    if (dto.campaignId) {
      const camp = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
      });
      if (camp) campaignName = camp.name;
    }

    let platformName: string | null = null;
    if (dto.platformId) {
      const plat = await this.prisma.platform.findFirst({
        where: { id: dto.platformId, organizationId },
      });
      if (plat) platformName = plat.name;
    }

    const created = await this.prisma.utmLink.create({
      data: {
        organizationId,
        campaignId: dto.campaignId || null,
        platformId: dto.platformId || null,
        landingPageId: dto.landingPageId || null,
        originalUrl: destinationUrl,
        utmSource: dto.utmSource.trim(),
        utmMedium: dto.utmMedium.trim(),
        utmCampaign: dto.utmCampaign.trim(),
        utmTerm: dto.utmTerm?.trim() || null,
        utmContent: dto.utmContent?.trim() || null,
        finalUrl,
        clicksCount: 0,
      },
      include: {
        campaign: { select: { id: true, name: true } },
        platform: { select: { id: true, name: true, code: true } },
        landingPage: { select: { id: true, title: true, url: true } },
      },
    });

    return {
      id: created.id,
      finalUrl: created.finalUrl,
      originalUrl: created.originalUrl,
      utmSource: created.utmSource,
      utmMedium: created.utmMedium,
      utmCampaign: created.utmCampaign,
      utmTerm: created.utmTerm,
      utmContent: created.utmContent,
      clicksCount: 0,
      isClickTrackingActive: false,
      clickTrackingNotice: 'شمارش مستقیم کلیک نیاز به نصب اسکریپت ردیاب Gapji در صفحه فرود دارد.',
      attributedLeadsCount: 0,
      landingPageId: created.landingPageId,
      landingPageTitle: created.landingPage?.title || landingPageTitle,
      campaignId: created.campaignId,
      campaignName: created.campaign?.name || campaignName,
      platformId: created.platformId,
      platformName: created.platform?.name || platformName || created.utmSource,
      createdAt: created.createdAt.toISOString(),
    };
  }

  // ==============================================================================
  // 3. OPTIONS & WORDPRESS STATUS
  // ==============================================================================

  async getOptions(user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    // 1. Landing Pages
    const landingPages = await this.prisma.landingPage.findMany({
      where: { organizationId },
      select: { id: true, title: true, url: true, campaignId: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Campaigns
    const campaigns = await this.prisma.campaign.findMany({
      where: { organizationId },
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Registered platforms in DB
    const dbPlatforms = await this.prisma.platform.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, code: true },
    });

    // Merge with standard platform templates to ensure comprehensive platform options
    const platformsMap = new Map<string, { id?: string; name: string; code: string }>();

    for (const tpl of PREDEFINED_PLATFORM_TEMPLATES) {
      platformsMap.set(tpl.code, {
        name: tpl.name,
        code: tpl.code,
      });
    }

    for (const p of dbPlatforms) {
      platformsMap.set(p.code, {
        id: p.id,
        name: p.name,
        code: p.code,
      });
    }

    return {
      landingPages,
      campaigns,
      platforms: Array.from(platformsMap.values()),
      commonMediums: COMMON_MEDIUMS,
    };
  }

  async getWordPressStatus(user?: CurrentUserPayload) {
    this.assertAccess(user);
    const organizationId = user?.organizationId || '00000000-0000-0000-0000-000000000001';

    const integrations = await this.prisma.wordpressIntegration.findMany({
      where: { organizationId },
      select: {
        id: true,
        siteUrl: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    const isConfigured = integrations.some((i) => i.isActive);

    return {
      isConfigured,
      integrations,
      webhookEndpoint: 'http://localhost:3001/api/leads/webhook',
      statusMessage: isConfigured
        ? 'افزونه وردپرس متصل و فعال است.'
        : 'ماژول اتصال مستقیم وردپرس (PRD ص ۲۹) در حال پیکربندی است. لیدها هم‌اکنون از طریق وب‌هوک API دریافت می‌شوند.',
    };
  }
}
