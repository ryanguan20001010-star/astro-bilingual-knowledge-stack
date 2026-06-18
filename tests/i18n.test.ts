import { describe, expect, it } from 'vitest';
import { getLocaleFromUrl, getLocalizedPath, t } from '../src/utils/i18n';

describe('i18n helpers', () => {
  it('detects locale from URL paths', () => {
    expect(getLocaleFromUrl('/zh/blog/example')).toBe('zh');
    expect(getLocaleFromUrl('/en/blog/example')).toBe('en');
    expect(getLocaleFromUrl('/blog/example')).toBe('en');
    expect(getLocaleFromUrl('/astro-bilingual-knowledge-stack/zh/')).toBe('zh');
  });

  it('translates known keys and falls back to the key', () => {
    expect(t('en', 'nav.home')).toBe('Home');
    expect(t('zh', 'nav.home')).toBe('首页');
    expect(t('en', 'nav.missing')).toBe('nav.missing');
  });

  it('switches between default and zh-prefixed routes', () => {
    expect(getLocalizedPath('/en/blog/welcome', 'zh')).toBe('/zh/blog/welcome');
    expect(getLocalizedPath('/zh/blog/welcome', 'en')).toBe('/en/blog/welcome');
  });
});
