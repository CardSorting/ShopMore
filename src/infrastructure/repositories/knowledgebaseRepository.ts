import type { KnowledgebaseCategory, KnowledgebaseArticle } from '@domain/models';

const CATEGORIES: KnowledgebaseCategory[] = [
  {
    id: 'order-issues',
    name: 'Order Issues',
    slug: 'order-issues',
    description: 'Track, change, or cancel your orders.',
    icon: 'package',
    articleCount: 5
  },
  {
    id: 'returns-refunds',
    name: 'Returns & Refunds',
    slug: 'returns-refunds',
    description: 'Everything you need to know about our return policy.',
    icon: 'rotate-ccw',
    articleCount: 4
  },
  {
    id: 'shipping-delivery',
    name: 'Shipping & Delivery',
    slug: 'shipping-delivery',
    description: 'Rates, timelines, and tracking information.',
    icon: 'truck',
    articleCount: 3
  },
  {
    id: 'card-condition',
    name: 'Card Condition & Authenticity',
    slug: 'card-condition',
    description: 'How we grade and verify every card we sell.',
    icon: 'shield-check',
    articleCount: 3
  },
  {
    id: 'payments-account',
    name: 'Payments & Account',
    slug: 'payments-account',
    description: 'Manage your profile, rewards, and billing.',
    icon: 'credit-card',
    articleCount: 4
  }
];

const ARTICLES: KnowledgebaseArticle[] = [
  // Order Issues
  {
    id: 'art-1',
    categoryId: 'order-issues',
    categoryName: 'Order Issues',
    title: 'How to track your order',
    slug: 'how-to-track-order',
    excerpt: 'Find out where your package is and when it will arrive.',
    content: `
# How to track your order

Once your order has shipped, you will receive an email with a tracking number and a link to the carrier's website.

### Ways to track:
1. **Via Email:** Click the link in your shipment confirmation email.
2. **Via Your Account:** Go to [My Orders](/orders) and click on the specific order.
3. **Via Support Hub:** Use the [Track Order](/support?track=true) quick link on our home page.

If your tracking information hasn't updated in 48 hours, please contact us.
    `,
    viewCount: 1540,
    helpfulCount: 120,
    notHelpfulCount: 5,
    tags: ['tracking', 'shipping', 'status'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'art-2',
    categoryId: 'order-issues',
    categoryName: 'Order Issues',
    title: 'Can I cancel my order?',
    slug: 'cancel-order-policy',
    excerpt: 'Learn about the window for order cancellations.',
    content: `
# Order Cancellations

We process orders quickly to ensure fast delivery. You can cancel your order within **1 hour** of placement.

### How to cancel:
1. Go to your [Order History](/orders).
2. If the "Cancel Order" button is visible, click it to immediately void the transaction.
3. If the button is not visible, your order has already entered our fulfillment queue.

*Note: Pre-orders have different cancellation terms. Please refer to our Pre-order Policy.*
    `,
    viewCount: 890,
    helpfulCount: 45,
    notHelpfulCount: 12,
    tags: ['cancellation', 'order-change'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-02-20')
  },
  // Returns
  {
    id: 'art-3',
    categoryId: 'returns-refunds',
    categoryName: 'Returns & Refunds',
    title: 'Our Return Policy',
    slug: 'return-policy',
    excerpt: 'Standard 30-day return window for most items.',
    content: `
# Return Policy

We want you to be happy with your collection. If you're not satisfied, we accept returns under the following conditions:

- **Sealed Products:** Must be returned in their original, unopened shrink-wrap within 30 days.
- **Single Cards:** Due to market volatility, single cards can only be returned if they arrive in a condition different than described.
- **Supplies:** Must be in original packaging.

### How to start a return:
Visit our [Returns Center](/support?contact=true&reason=return) to print a prepaid shipping label.
    `,
    viewCount: 2100,
    helpfulCount: 180,
    notHelpfulCount: 8,
    tags: ['returns', 'refunds', 'policy'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-04-01')
  },
  // Card Condition
  {
    id: 'art-4',
    categoryId: 'card-condition',
    categoryName: 'Card Condition & Authenticity',
    title: 'Card Conditioning Guide',
    slug: 'card-conditioning-guide',
    excerpt: 'How we define Near Mint, Lightly Played, and more.',
    content: `
# Card Conditioning Guide

Accuracy is our priority. We use the following industry standards:

- **Near Mint (NM):** Minimal to no wear from shuffling, play, or handling.
- **Lightly Played (LP):** Minor border or corner wear, or even just slight scuffs or scratches.
- **Moderately Played (MP):** Border wear, corner wear, scratching or scuffing, creases or whitening.
- **Heavily Played (HP):** Severe wear, but still legal for tournament play in a sleeve.

Every card over $50 is double-checked by our senior grading team before shipment.
    `,
    viewCount: 3200,
    helpfulCount: 290,
    notHelpfulCount: 3,
    tags: ['grading', 'condition', 'quality'],
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-04-10')
  }
];

export const knowledgebaseRepository = {
  async getCategories(): Promise<KnowledgebaseCategory[]> {
    return CATEGORIES;
  },

  async getArticles(categoryId?: string): Promise<KnowledgebaseArticle[]> {
    if (categoryId) {
      return ARTICLES.filter(a => a.categoryId === categoryId);
    }
    return ARTICLES;
  },

  async getArticleBySlug(slug: string): Promise<KnowledgebaseArticle | null> {
    return ARTICLES.find(a => a.slug === slug) || null;
  },

  async searchArticles(query: string): Promise<KnowledgebaseArticle[]> {
    const q = query.toLowerCase();
    return ARTICLES.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q) ||
      a.tags?.some(t => t.toLowerCase().includes(q))
    ).sort((a, b) => b.viewCount - a.viewCount);
  },

  async getPopularArticles(limit: number = 5): Promise<KnowledgebaseArticle[]> {
    return [...ARTICLES]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  },

  async addFeedback(articleId: string, isHelpful: boolean, userId?: string): Promise<void> {
    const article = ARTICLES.find(a => a.id === articleId);
    if (article) {
      if (isHelpful) article.helpfulCount++;
      else article.notHelpfulCount++;
      // We could persist userId feedback here if we had a DB
    }
  }
};
