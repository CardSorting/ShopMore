import React from 'react';
import { 
  ArrowLeft, ChevronRight, FileText, ThumbsUp, ThumbsDown, 
  MessageSquare, ExternalLink, Calendar, User, Search
} from 'lucide-react';
import type { KnowledgebaseArticle, KnowledgebaseCategory } from '@domain/models';
import Link from 'next/link';

export function KnowledgebaseCategoryCard({ category, onClick }: { category: KnowledgebaseCategory, onClick: (c: KnowledgebaseCategory) => void }) {
  return (
    <button
      onClick={() => onClick(category)}
      className="group flex flex-col items-start p-6 rounded-3xl bg-white border border-gray-100 shadow-xs hover:shadow-xl hover:border-primary-100 transition-all text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold mb-2 group-hover:text-primary-600 transition-colors">{category.name}</h3>
      <p className="text-sm font-medium text-gray-500 line-clamp-2">{category.description}</p>
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-500 transition-colors">
        <span>{category.articleCount} Articles</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}

export function KnowledgebaseArticleList({ articles, categoryName, onBack, onArticleClick }: { 
  articles: KnowledgebaseArticle[], 
  categoryName: string, 
  onBack: () => void,
  onArticleClick: (article: KnowledgebaseArticle) => void
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">{categoryName}</h2>
          <p className="text-sm font-medium text-gray-500">Browse all articles in this category</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {articles.map(article => (
          <button 
            key={article.id}
            onClick={() => onArticleClick(article)}
            className="flex items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 hover:border-primary-100 hover:shadow-lg transition-all group text-left"
          >
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 group-hover:text-primary-500 group-hover:bg-primary-50 transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{article.title}</p>
                <p className="text-sm font-medium text-gray-500 mt-1 line-clamp-1">{article.excerpt}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function KnowledgebaseArticleView({ article, onBack }: { article: KnowledgebaseArticle, onBack: () => void }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">{article.categoryName}</span>
              <span className="text-[10px] font-bold text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-400">{Math.ceil(article.content.split(' ').length / 200)} min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{article.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="prose prose-gray max-w-none prose-h1:text-2xl prose-h1:font-black prose-h2:text-xl prose-h2:font-black prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-gray-900">
             {/* Note: In a real app we'd use a markdown renderer here */}
             <div className="whitespace-pre-wrap font-medium text-gray-600 leading-relaxed text-base">
               {article.content}
             </div>
          </div>

          <div className="mt-16 pt-10 border-t border-gray-100 text-center">
            <p className="text-sm font-bold text-gray-900 mb-6">Was this article helpful?</p>
            <div className="flex items-center justify-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-100 hover:border-primary-500 hover:text-primary-600 transition-all font-black text-xs uppercase tracking-widest text-gray-400">
                <ThumbsUp className="h-4 w-4" />
                Yes
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-100 hover:border-red-500 hover:text-red-600 transition-all font-black text-xs uppercase tracking-widest text-gray-400">
                <ThumbsDown className="h-4 w-4" />
                No
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-gray-50 rounded-4xl p-8 border border-gray-100/50">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Article Details</h3>
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Author</p>
                    <p className="text-xs font-bold text-gray-900">{article.authorName || 'Support Team'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Last Updated</p>
                    <p className="text-xs font-bold text-gray-900">{article.updatedAt.toLocaleDateString()}</p>
                  </div>
                </div>
             </div>
           </div>

           <div className="bg-primary-600 rounded-4xl p-8 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
             <h3 className="text-lg font-black mb-3 relative z-10">Still need help?</h3>
             <p className="text-sm font-medium text-white/80 mb-8 leading-relaxed relative z-10">Can't find the answer you're looking for? Our team is available 24/7 to assist you.</p>
             <Link href="/support?contact=true" className="inline-flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-white text-primary-700 text-sm font-black uppercase tracking-widest hover:shadow-lg transition-all relative z-10">
               Contact Support
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

export function SupportSearchOverlay({ query, results, onClose, onResultClick }: { 
  query: string, 
  results: KnowledgebaseArticle[], 
  onClose: () => void,
  onResultClick: (article: KnowledgebaseArticle) => void
}) {
  if (!query) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Results for "{query}"</h4>
        <button onClick={onClose} className="text-[10px] font-bold text-primary-600 hover:underline uppercase tracking-widest">Clear</button>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {results.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {results.map(article => (
              <button 
                key={article.id}
                onClick={() => onResultClick(article)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">{article.title}</p>
                  <p className="text-[10px] font-medium text-gray-400 truncate">{article.categoryName}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400">No articles found. Try a different keyword.</p>
          </div>
        )}
      </div>
      {results.length > 0 && (
        <div className="p-4 bg-gray-50 border-t text-center">
          <Link href="/support?contact=true" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline">
            Still need help? Talk to an expert
          </Link>
        </div>
      )}
    </div>
  );
}
