/**
 * ورودی‌های سازنده آدرس رهگیری UTM
 */
export interface UtmParamsInput {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

/**
 * ابزار خالص ساخت آدرس صفحه فرود با پارامترهای رهگیری استاندارد UTM
 * با پشتیبانی از URLهای دارای کوئری یا هش قبلی و کدگذاری امن مقادیر
 */
export function buildUtmUrl(
  rawLandingUrl: string,
  params: Partial<UtmParamsInput>,
): string {
  const trimmedUrl = (rawLandingUrl || '').trim();
  if (!trimmedUrl) {
    return '';
  }

  // جداسازی هش فرگمنت در صورت وجود (#section)
  let urlPart = trimmedUrl;
  let hashPart = '';
  const hashIndex = trimmedUrl.indexOf('#');
  if (hashIndex !== -1) {
    urlPart = trimmedUrl.substring(0, hashIndex);
    hashPart = trimmedUrl.substring(hashIndex);
  }

  // آماده‌سازی پارامترهای UTM
  const queryParams: string[] = [];

  const addParam = (key: string, val?: string) => {
    if (val && val.trim()) {
      queryParams.push(`${key}=${encodeURIComponent(val.trim())}`);
    }
  };

  addParam('utm_source', params.source);
  addParam('utm_medium', params.medium);
  addParam('utm_campaign', params.campaign);
  addParam('utm_term', params.term);
  addParam('utm_content', params.content);

  if (queryParams.length === 0) {
    return trimmedUrl;
  }

  const utmQueryString = queryParams.join('&');
  const separator = urlPart.includes('?') ? '&' : '?';

  return `${urlPart}${separator}${utmQueryString}${hashPart}`;
}
