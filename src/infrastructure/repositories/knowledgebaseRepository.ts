import { getSQLiteDB } from '../sqlite/database';
import type { KnowledgebaseCategory, KnowledgebaseArticle } from '@domain/models';

function mapCategory(row: any): KnowledgebaseCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon || undefined,
    articleCount: row.articleCount,
  };
}

function mapArticle(row: any): KnowledgebaseArticle {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName: row.categoryName || undefined,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    authorName: row.authorName || undefined,
    viewCount: row.viewCount,
    helpfulCount: row.helpfulCount,
    notHelpfulCount: row.notHelpfulCount,
    tags: row.tags ? JSON.parse(row.tags) : [],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export const knowledgebaseRepository = {
  async getCategories(): Promise<KnowledgebaseCategory[]> {
    const db = getSQLiteDB();
    const rows = await db.selectFrom('knowledgebase_categories').selectAll().execute();
    return rows.map(mapCategory);
  },

  async getArticles(categoryId?: string): Promise<KnowledgebaseArticle[]> {
    const db = getSQLiteDB();
    let query = db.selectFrom('knowledgebase_articles as a')
      .leftJoin('knowledgebase_categories as c', 'a.categoryId', 'c.id')
      .select([
        'a.id',
        'a.categoryId',
        'c.name as categoryName',
        'a.title',
        'a.slug',
        'a.content',
        'a.excerpt',
        'a.authorName',
        'a.viewCount',
        'a.helpfulCount',
        'a.notHelpfulCount',
        'a.tags',
        'a.createdAt',
        'a.updatedAt'
      ]);

    if (categoryId) {
      query = query.where('a.categoryId', '=', categoryId);
    }

    const rows = await query.execute();
    return rows.map(mapArticle);
  },

  async getArticleBySlug(slug: string): Promise<KnowledgebaseArticle | null> {
    const db = getSQLiteDB();
    const row = await db.selectFrom('knowledgebase_articles as a')
      .leftJoin('knowledgebase_categories as c', 'a.categoryId', 'c.id')
      .select([
        'a.id',
        'a.categoryId',
        'c.name as categoryName',
        'a.title',
        'a.slug',
        'a.content',
        'a.excerpt',
        'a.authorName',
        'a.viewCount',
        'a.helpfulCount',
        'a.notHelpfulCount',
        'a.tags',
        'a.createdAt',
        'a.updatedAt'
      ])
      .where('a.slug', '=', slug)
      .executeTakeFirst();

    if (!row) return null;
    return mapArticle(row);
  },

  async searchArticles(query: string): Promise<KnowledgebaseArticle[]> {
    const db = getSQLiteDB();
    const q = `%${query.toLowerCase()}%`;
    const rows = await db.selectFrom('knowledgebase_articles as a')
      .leftJoin('knowledgebase_categories as c', 'a.categoryId', 'c.id')
      .select([
        'a.id',
        'a.categoryId',
        'c.name as categoryName',
        'a.title',
        'a.slug',
        'a.content',
        'a.excerpt',
        'a.authorName',
        'a.viewCount',
        'a.helpfulCount',
        'a.notHelpfulCount',
        'a.tags',
        'a.createdAt',
        'a.updatedAt'
      ])
      .where((eb) => eb.or([
        eb('a.title', 'like', q),
        eb('a.content', 'like', q),
        eb('a.tags', 'like', q)
      ]))
      .orderBy('a.viewCount', 'desc')
      .execute();

    return rows.map(mapArticle);
  },

  async getPopularArticles(limit: number = 5): Promise<KnowledgebaseArticle[]> {
    const db = getSQLiteDB();
    const rows = await db.selectFrom('knowledgebase_articles as a')
      .leftJoin('knowledgebase_categories as c', 'a.categoryId', 'c.id')
      .select([
        'a.id',
        'a.categoryId',
        'c.name as categoryName',
        'a.title',
        'a.slug',
        'a.content',
        'a.excerpt',
        'a.authorName',
        'a.viewCount',
        'a.helpfulCount',
        'a.notHelpfulCount',
        'a.tags',
        'a.createdAt',
        'a.updatedAt'
      ])
      .orderBy('a.viewCount', 'desc')
      .limit(limit)
      .execute();

    return rows.map(mapArticle);
  },

  async addFeedback(articleId: string, isHelpful: boolean, userId?: string): Promise<void> {
    const db = getSQLiteDB();
    
    await db.transaction().execute(async (trx) => {
      if (isHelpful) {
        await trx.updateTable('knowledgebase_articles')
          .set((eb) => ({
            helpfulCount: eb('helpfulCount', '+', 1)
          }))
          .where('id', '=', articleId)
          .execute();
      } else {
        await trx.updateTable('knowledgebase_articles')
          .set((eb) => ({
            notHelpfulCount: eb('notHelpfulCount', '+', 1)
          }))
          .where('id', '=', articleId)
          .execute();
      }

      await trx.insertInto('support_article_feedback')
        .values({
          id: crypto.randomUUID(),
          articleId,
          isHelpful: isHelpful ? 1 : 0,
          userId: userId || null,
          createdAt: new Date().toISOString()
        })
        .execute();
    });
  },

  async saveCategory(category: KnowledgebaseCategory): Promise<void> {
    const db = getSQLiteDB();
    await db.insertInto('knowledgebase_categories')
      .values({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon || null,
        articleCount: category.articleCount,
      })
      .onConflict(oc => oc.column('id').doUpdateSet({
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon || null,
        articleCount: category.articleCount,
      }))
      .execute();
  },

  async saveArticle(article: KnowledgebaseArticle): Promise<void> {
    const db = getSQLiteDB();
    await db.insertInto('knowledgebase_articles')
      .values({
        id: article.id,
        categoryId: article.categoryId,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        authorName: article.authorName || null,
        viewCount: article.viewCount,
        helpfulCount: article.helpfulCount,
        notHelpfulCount: article.notHelpfulCount,
        tags: article.tags ? JSON.stringify(article.tags) : null,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      })
      .onConflict(oc => oc.column('id').doUpdateSet({
        categoryId: article.categoryId,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        authorName: article.authorName || null,
        updatedAt: article.updatedAt.toISOString(),
      }))
      .execute();
  }
};

