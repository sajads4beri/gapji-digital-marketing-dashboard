/**
 * نقطه ورود ماژول مدیریت هزینه‌های بازاریابی (Marketing Costs Feature)
 */

import { ICostService } from './costs.contract';
import { costApi } from './costs.api';

/**
 * سرویس اصلی هزینه‌ها متصل به سرور واقعی NestJS و دیتابیس PostgreSQL
 */
export const costService: ICostService = costApi;

export * from './types';
export * from './costs.contract';
export * from './costs.api';
export * from './costs.storage';
export * from './costs.mock';
export * from './components';
