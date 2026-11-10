import { ICampaignService } from './campaign.contract';
import { campaignApi, mockCampaignDevTools } from './campaign.api';
import { MockCampaignService } from './campaign.mock';

/**
 * سرویس اصلی کمپین‌ها متصل به بک‌اند NestJS و پایگاه داده PostgreSQL
 * تمام بخش‌های UI فرانت‌اند از طریق این سرویس با پایگاه داده واقعی تعامل دارند.
 */
export const campaignService: ICampaignService = campaignApi;

export { mockCampaignDevTools };
export * from './campaign.contract';
export * from './campaign.api';
export { MockCampaignService } from './campaign.mock';
