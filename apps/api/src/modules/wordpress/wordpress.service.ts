import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { UpdateWordpressConfigDto } from './dto/update-wordpress-config.dto';
import { TestConnectionDto } from './dto/test-connection.dto';

export interface CurrentUserPayload {
  id: string;
  organizationId?: string;
  role?: string;
  email?: string;
}

function normalizePersianPhone(phone: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let normalized = phone || '';
  for (let i = 0; i < 10; i++) {
    normalized = normalized
      .replace(new RegExp(persianDigits[i], 'g'), i.toString())
      .replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return normalized.replace(/[\s\-\(\)\+]/g, '');
}

@Injectable()
export class WordpressService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrgId(currentUser: CurrentUserPayload): string {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new BadRequestException('شناسه سازمان در نشست کاربر یافت نشد.');
    }
    return orgId;
  }

  /**
   * دریافت یا مقداردهی اولیه تنظیمات یکپارچه‌سازی با وردپرس
   */
  async getConfig(currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    let config = await this.prisma.wordpressIntegration.findFirst({
      where: { organizationId: orgId },
    });

    if (!config) {
      const generatedSecret = `whsec_${crypto.randomBytes(16).toString('hex')}`;
      const defaultMapping = JSON.stringify({
        fullName: 'your-name',
        mobile: 'your-tel',
        email: 'your-email',
        city: 'your-city',
        utmSource: 'utm_source',
        utmCampaign: 'utm_campaign',
      });

      config = await this.prisma.wordpressIntegration.create({
        data: {
          organizationId: orgId,
          siteUrl: 'https://example.com',
          apiKeyHash: `wp_key_${crypto.randomUUID()}`,
          webhookSecret: generatedSecret,
          leadMappingConfig: defaultMapping,
          isActive: true,
        },
      });
    }

    return config;
  }

  /**
   * ویرایش تنظیمات، آدرس سایت وردپرسی و نگاشت فیلدهای لید
   */
  async updateConfig(currentUser: CurrentUserPayload, dto: UpdateWordpressConfigDto) {
    const orgId = this.getOrgId(currentUser);
    const existing = await this.getConfig(currentUser);

    return this.prisma.wordpressIntegration.update({
      where: { id: existing.id },
      data: {
        siteUrl: dto.siteUrl !== undefined ? dto.siteUrl.trim() : undefined,
        webhookSecret: dto.webhookSecret !== undefined ? dto.webhookSecret.trim() : undefined,
        leadMappingConfig: dto.leadMappingConfig !== undefined ? dto.leadMappingConfig : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });
  }

  /**
   * چرخش کلید امنیتی وب‌هوک (Rotate Webhook Secret)
   */
  async rotateSecret(currentUser: CurrentUserPayload) {
    const existing = await this.getConfig(currentUser);
    const newSecret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

    const updated = await this.prisma.wordpressIntegration.update({
      where: { id: existing.id },
      data: {
        webhookSecret: newSecret,
      },
    });

    return {
      success: true,
      message: 'کلید امنیتی وب‌هوک با موفقیت نوسازی شد.',
      newSecret: updated.webhookSecret,
    };
  }

  /**
   * دریافت لاگ رویدادها و درخواست‌های ردشده وردپرس
   */
  async getWebhookLogs(currentUser: CurrentUserPayload) {
    const orgId = this.getOrgId(currentUser);

    return this.prisma.wordpressWebhookLog.findMany({
      where: { organizationId: orgId },
      orderBy: { receivedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * شبیه‌سازی و تست اتصال وب‌هوک وردپرس
   */
  async testConnection(currentUser: CurrentUserPayload, dto: TestConnectionDto) {
    const config = await this.getConfig(currentUser);

    const testPayload = dto.payload || {
      'your-name': 'لید تستی وردپرس',
      'your-tel': '۰۹۱۲۹۹۹۸۸۷۷',
      'your-email': 'test-lead@gapji.ir',
      'your-city': 'تهران',
      utm_source: 'wordpress_test',
      utm_campaign: 'integration_healthcheck',
    };

    const simulatedResult = await this.handleWebhook(
      config.webhookSecret,
      testPayload,
      '127.0.0.1 (تست سیستمی)'
    );

    return {
      success: true,
      message: 'تست دریافت وب‌هوک وردپرس و نگاشت فیلدهای لید با موفقیت انجام شد.',
      result: simulatedResult,
    };
  }

  /**
   * دریافت و پردازش وب‌هوک ورودی از فرم‌های وردپرس (Gravity Forms, Contact Form 7, Elementor)
   */
  async handleWebhook(
    secret: string,
    payload: any,
    ipAddress?: string
  ) {
    if (!secret) {
      throw new UnauthorizedException('کلید امنیتی وب‌هوک ارسال نشده است.');
    }

    const integration = await this.prisma.wordpressIntegration.findFirst({
      where: {
        webhookSecret: secret,
        isActive: true,
      },
    });

    if (!integration) {
      throw new UnauthorizedException('کلید امنیتی وب‌هوک نامعتبر است یا اتصال وردپرس غیرفعال می‌باشد.');
    }

    const orgId = integration.organizationId;

    // پارس تنظیمات نگاشت فیلدها
    let mapping: Record<string, string> = {
      fullName: 'your-name',
      mobile: 'your-tel',
      email: 'your-email',
      city: 'your-city',
      utmSource: 'utm_source',
      utmCampaign: 'utm_campaign',
    };

    try {
      if (integration.leadMappingConfig) {
        mapping = { ...mapping, ...JSON.parse(integration.leadMappingConfig) };
      }
    } catch {
      // استفاده از نگاشت پیش‌فرض
    }

    // استخراج فیلدها از پی‌لود ورودی
    const fullNameRaw = payload[mapping.fullName] || payload.fullName || payload.name || 'مخاطب وردپرس';
    const mobileRaw = payload[mapping.mobile] || payload.mobile || payload.phone || payload.tel || '';
    const emailRaw = payload[mapping.email] || payload.email || null;
    const cityRaw = payload[mapping.city] || payload.city || null;
    const utmSourceRaw = payload[mapping.utmSource] || payload.utm_source || 'wordpress';
    const utmCampaignRaw = payload[mapping.utmCampaign] || payload.utm_campaign || null;

    const normalizedMobile = normalizePersianPhone(mobileRaw);

    // بررسی وجود شماره همراه معتبر
    if (!normalizedMobile || normalizedMobile.length < 10) {
      await this.prisma.wordpressWebhookLog.create({
        data: {
          organizationId: orgId,
          wordpressIntegrationId: integration.id,
          status: 'rejected',
          reason: `شماره موبایل نامعتبر یا خالی است: «${mobileRaw}»`,
          payloadSummary: JSON.stringify(payload).slice(0, 500),
          ipAddress: ipAddress || null,
        },
      });

      throw new BadRequestException('شماره موبایل ارسال‌شده نامعتبر یا ناقص است.');
    }

    // بررسی وجود لید تکراری در سازمان
    const existingLead = await this.prisma.lead.findFirst({
      where: {
        organizationId: orgId,
        mobile: normalizedMobile,
      },
    });

    if (existingLead) {
      // به‌روزرسانی لید موجود
      await this.prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          email: emailRaw || existingLead.email,
          city: cityRaw || existingLead.city,
          utmSource: utmSourceRaw || existingLead.utmSource,
          utmCampaign: utmCampaignRaw || existingLead.utmCampaign,
        },
      });

      await this.prisma.wordpressWebhookLog.create({
        data: {
          organizationId: orgId,
          wordpressIntegrationId: integration.id,
          status: 'duplicate',
          reason: `لید با شماره ${normalizedMobile} از قبل در سازمان ثبت بود (اطلاعات به‌روزرسانی گردید)`,
          payloadSummary: JSON.stringify({ fullName: fullNameRaw, mobile: normalizedMobile }),
          ipAddress: ipAddress || null,
        },
      });

      await this.prisma.wordpressIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      return {
        success: true,
        message: 'لید از قبل وجود داشت و اطلاعات با موفقیت همگام شد.',
        leadId: existingLead.id,
        isDuplicate: true,
      };
    }

    // ثبت لید جدید در سیستم
    const newLead = await this.prisma.lead.create({
      data: {
        organizationId: orgId,
        fullName: fullNameRaw.trim(),
        mobile: normalizedMobile,
        email: emailRaw ? emailRaw.trim() : null,
        city: cityRaw ? cityRaw.trim() : null,
        source: 'wordpress',
        utmSource: utmSourceRaw,
        utmCampaign: utmCampaignRaw,
        statusKey: 'new',
      },
    });

    // ثبت لاگ موفقیت در جدول لاگ‌های وردپرس
    await this.prisma.wordpressWebhookLog.create({
      data: {
        organizationId: orgId,
        wordpressIntegrationId: integration.id,
        status: 'success',
        reason: 'لید جدید با موفقیت از طریق وب‌هوک وردپرس در پایگاه داده ثبت گردید.',
        payloadSummary: JSON.stringify({ fullName: fullNameRaw, mobile: normalizedMobile }),
        ipAddress: ipAddress || null,
      },
    });

    await this.prisma.wordpressIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      success: true,
      message: 'لید جدید با موفقیت ثبت شد.',
      leadId: newLead.id,
      isDuplicate: false,
    };
  }
}
