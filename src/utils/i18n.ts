/**
 * i18n Utilities
 */

import enLocale from '../data/locales/en.json';
import zhLocale from '../data/locales/zh.json';

export type Locale = 'en' | 'zh';

const locales: Record<Locale, typeof enLocale> = {
  en: enLocale,
  zh: zhLocale,
};

/**
 * Extract locale from URL path
 * URLs starting with /zh/ are Chinese, otherwise English
 */
export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname = typeof url === 'string' ? url : url.pathname;
  return pathname.startsWith('/zh') ? 'zh' : 'en';
}

/**
 * Get translation by key path (e.g., 'nav.home')
 * Returns the key itself if translation not found
 */
export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: unknown = locales[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Get localized path for URL generation
 * Preserves path structure while switching locale prefix
 */
export function getLocalizedPath(path: string, targetLocale: Locale): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const isZhPath = cleanPath.startsWith('zh/') || cleanPath === 'zh';
  const isEnPath = cleanPath.startsWith('en/') || cleanPath === 'en';
  
  let basePath: string;
  if (isZhPath) {
    basePath = cleanPath.slice(3); // Remove 'zh/' or 'zh'
  } else if (isEnPath) {
    basePath = cleanPath.slice(3); // Remove 'en/' or 'en'
  } else {
    basePath = cleanPath;
  }
  
  const localizedBasePath = basePath;

  if (targetLocale === 'zh') {
    return localizedBasePath ? `/zh/${localizedBasePath}` : '/zh/';
  }
  return localizedBasePath ? `/en/${localizedBasePath}` : '/en/';
}

/**
 * Get alternate language URL for hreflang tags
 */
export function getAlternateUrl(currentUrl: string, baseUrl: string): { en: string; zh: string } {
  const enPath = getLocalizedPath(currentUrl, 'en');
  const zhPath = getLocalizedPath(currentUrl, 'zh');
  
  return {
    en: `${baseUrl}${enPath}`,
    zh: `${baseUrl}${zhPath}`,
  };
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: Locale): typeof enLocale {
  return locales[locale];
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
