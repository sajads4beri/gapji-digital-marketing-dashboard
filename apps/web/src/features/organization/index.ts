/**
 * ماژول مدیریت تنظیمات سازمان (Organization Settings Feature)
 * اتصال کامل به سرویس واقعی بک‌اند NestJS و پایگاه داده PostgreSQL
 */

export * from './types';
export * from './organization.contract';
export { realOrganizationService as organizationService } from './organization.api';
export * from './components';
