import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CurrentUserPayload {
  id: string;
  email: string;
  mobile?: string;
  fullName?: string;
  organizationId: string | null;
  role?: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  type: 'lead' | 'campaign';
  url: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  leads: SearchResultItem[];
  campaigns: SearchResultItem[];
  items: SearchResultItem[];
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * تبدیل ارقام فارسی و عربی به ارقام انگلیسی جهت یکنواختی جستجوی شماره تماس
   */
  private normalizeSearchQuery(input: string): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    let normalized = input.trim();
    for (let i = 0; i < 10; i++) {
      normalized = normalized
        .replace(new RegExp(persianDigits[i], 'g'), i.toString())
        .replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    }
    return normalized;
  }

  async globalSearch(
    queryText: string,
    user: CurrentUserPayload,
  ): Promise<GlobalSearchResponse> {
    if (!user.organizationId) {
      throw new BadRequestException('شناسه سازمان کاربر برای جستجو نامعتبر است');
    }

    const rawQuery = queryText?.trim() || '';
    if (rawQuery.length < 2) {
      return {
        query: rawQuery,
        total: 0,
        leads: [],
        campaigns: [],
        items: [],
      };
    }

    const orgId = user.organizationId;
    const normalizedDigitsQuery = this.normalizeSearchQuery(rawQuery);

    // ۱. جستجوی سرنخ‌ها (Leads) با رعایت ایزولاسیون سازمانی و نقش‌ها
    let leadResults: SearchResultItem[] = [];

    // اگر نقش کارفرما باشد، طبق ماتریس دسترسی به لیدها دسترسی ندارد
    if (user.role !== 'client') {
      const leadWhere: any = {
        organizationId: orgId,
        OR: [
          { fullName: { contains: rawQuery, mode: 'insensitive' } },
          { mobile: { contains: normalizedDigitsQuery } },
          { email: { contains: rawQuery, mode: 'insensitive' } },
        ],
      };

      // کارشناس فروش فقط لیدهای تخصیص‌یافته به خودش را می‌بیند
      if (user.role === 'sales_agent') {
        leadWhere.assignedToId = user.id;
      }

      const leads = await this.prisma.lead.findMany({
        where: leadWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          mobile: true,
          statusKey: true,
        },
      });

      leadResults = leads.map((lead) => {
        // ماسک شماره موبایل برای نقش‌های غیرمجاز اگر لازم باشد
        const displayMobile =
          user.role === 'sales_agent' || user.role === 'admin' || user.role === 'marketing_manager'
            ? lead.mobile
            : lead.mobile.replace(/(\d{4})\d{3}(\d{4})/, '$1***$2');

        return {
          id: lead.id,
          title: lead.fullName,
          subtitle: displayMobile,
          badge: lead.statusKey,
          type: 'lead',
          url: `/leads/${lead.id}`,
        };
      });
    }

    // ۲. جستجوی کمپین‌ها (Campaigns)
    let campaignResults: SearchResultItem[] = [];

    const campaignWhere: any = {
      organizationId: orgId,
      name: { contains: rawQuery, mode: 'insensitive' },
    };

    const campaigns = await this.prisma.campaign.findMany({
      where: campaignWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
      },
    });

    campaignResults = campaigns.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.type,
      badge: c.status,
      type: 'campaign',
      url: `/campaigns/${c.id}`,
    }));

    const combinedItems = [...leadResults, ...campaignResults];

    return {
      query: rawQuery,
      total: combinedItems.length,
      leads: leadResults,
      campaigns: campaignResults,
      items: combinedItems,
    };
  }
}
