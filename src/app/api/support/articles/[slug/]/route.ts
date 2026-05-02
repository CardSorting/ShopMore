import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/knowledgebaseRepository';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const article = await knowledgebaseRepository.getArticleBySlug(slug);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json(article);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
