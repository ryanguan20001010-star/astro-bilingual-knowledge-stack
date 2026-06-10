import type { CollectionEntry } from 'astro:content';

type PostWithPubDate = {
    data: {
        pubDate: Date;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

export function sortPostsByDate<T extends PostWithPubDate>(posts: T[]): T[] {
    return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function filterPostsByCategory(posts: CollectionEntry<'blog'>[], category: string): CollectionEntry<'blog'>[] {
    if (!category) return posts;
    return posts.filter(post => post.data.category === category);
}
