import { describe, expect, it } from 'vitest';
import { baseSchema } from '../src/utils/content-schema';

describe('content schema', () => {
  it('accepts a minimal bilingual article frontmatter object', () => {
    const parsed = baseSchema.parse({
      title: 'Welcome',
      pubDate: '2026-01-01',
      description: 'A concise description for a knowledge-site article.',
      locale: 'en',
      category: 'guide',
    });

    expect(parsed.title).toBe('Welcome');
    expect(parsed.locale).toBe('en');
    expect(parsed.draft).toBe(false);
  });

  it('rejects descriptions longer than 160 characters', () => {
    expect(() =>
      baseSchema.parse({
        title: 'Too Long',
        pubDate: '2026-01-01',
        description: 'x'.repeat(161),
        locale: 'en',
      }),
    ).toThrow();
  });
});
