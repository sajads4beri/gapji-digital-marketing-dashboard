/**
 * Safe UTM URL Builder & Validator
 * Source: Product Document p. 14 §13 (سازنده UTM)
 */

export interface BuildUtmOptions {
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface UtmValidationResult {
  isValid: boolean;
  error?: string;
  finalUrl?: string;
}

export class UtmUrlBuilder {
  /**
   * Validate that URL is well-formed and uses HTTPS
   */
  public static validateDestinationUrl(rawUrl: string): { isValid: boolean; error?: string; urlObj?: URL } {
    if (!rawUrl || !rawUrl.trim()) {
      return { isValid: false, error: 'آدرس مقصد نمی‌تواند خالی باشد.' };
    }

    const trimmed = rawUrl.trim();

    try {
      const parsed = new URL(trimmed);

      if (parsed.protocol !== 'https:') {
        return {
          isValid: false,
          error: 'آدرس مقصد باید الزاماً دارای پروتکل امن HTTPS باشد (پروتکل فعلی: ' + parsed.protocol + ').',
        };
      }

      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return {
          isValid: false,
          error: 'دامنه آدرس مقصد نامعتبر است.',
        };
      }

      return { isValid: true, urlObj: parsed };
    } catch (err: any) {
      return {
        isValid: false,
        error: 'فرمت آدرس اینترنتی وارد شده نامعتبر است. نمونه صحیح: https://example.com/landing',
      };
    }
  }

  /**
   * Build the complete UTM tracking URL preserving query parameters and hash fragments
   */
  public static build(options: BuildUtmOptions): string {
    const valResult = this.validateDestinationUrl(options.destinationUrl);
    if (!valResult.isValid || !valResult.urlObj) {
      throw new Error(valResult.error || 'آدرس مقصد نامعتبر است.');
    }

    if (!options.utmSource || !options.utmSource.trim()) {
      throw new Error('منبع (utm_source) الزامی است.');
    }
    if (!options.utmMedium || !options.utmMedium.trim()) {
      throw new Error('رسانه (utm_medium) الزامی است.');
    }
    if (!options.utmCampaign || !options.utmCampaign.trim()) {
      throw new Error('کمپین (utm_campaign) الزامی است.');
    }

    const rawUrl = options.destinationUrl.trim();

    // 1. Separate hash fragment if present (#section)
    let urlWithoutHash = rawUrl;
    let hashPart = '';
    const hashIndex = rawUrl.indexOf('#');
    if (hashIndex !== -1) {
      urlWithoutHash = rawUrl.substring(0, hashIndex);
      hashPart = rawUrl.substring(hashIndex);
    }

    // 2. Parse URL to safely inspect and update search parameters
    const parsed = new URL(urlWithoutHash);

    // Set standard UTM parameters (automatically handles URL encoding and overrides duplicates)
    parsed.searchParams.set('utm_source', options.utmSource.trim());
    parsed.searchParams.set('utm_medium', options.utmMedium.trim());
    parsed.searchParams.set('utm_campaign', options.utmCampaign.trim());

    if (options.utmTerm && options.utmTerm.trim()) {
      parsed.searchParams.set('utm_term', options.utmTerm.trim());
    } else {
      parsed.searchParams.delete('utm_term');
    }

    if (options.utmContent && options.utmContent.trim()) {
      parsed.searchParams.set('utm_content', options.utmContent.trim());
    } else {
      parsed.searchParams.delete('utm_content');
    }

    // 3. Reassemble URL with original hash part preserved
    const baseWithParams = parsed.toString();
    return baseWithParams + hashPart;
  }
}
