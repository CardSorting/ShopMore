import { NextResponse } from 'next/server';
import { knowledgebaseRepository } from '@infrastructure/repositories/knowledgebaseRepository';

export async function GET() {
  try {
    const categories = await knowledgebaseRepository.getCategories();
    return NextResponse.json(categories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
