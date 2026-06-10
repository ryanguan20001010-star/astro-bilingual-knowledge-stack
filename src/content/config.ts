import { defineCollection, z } from 'astro:content';

export const baseSchema = z.object({
  title: z.string(),
  pubDate: z.coerce.date(),
  description: z.string().max(160, 'Description must be 160 characters or less'),
  locale: z.enum(['en', 'zh']),
  author: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: baseSchema,
});

const docsCollection = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    relatedTerms: z.array(z.string()).optional(),
  }),
});

export const collections = {
  blog: blogCollection,
  docs: docsCollection,
};
