import { MetadataRoute } from 'next';

/**
 * [LAYER: APP]
 * Robots.txt configuration.
 * Standard e-commerce configuration for crawling and indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/api/',
          '/*?q=', // Avoid indexing internal search results to prevent crawl budget waste
        ],
      },
    ],
    sitemap: 'https://dreambeesart.com/sitemap.xml',
  };
}
