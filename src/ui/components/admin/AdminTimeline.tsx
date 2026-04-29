'use client';

import React from 'react';
import { Circle, CheckCircle2, Clock, User, Package, AlertCircle } from 'lucide-react';
import { formatShortDate } from '@utils/formatters';

export interface TimelineEvent {
  id: string;
  type: 'creation' | 'edit' | 'status_change' | 'receiving' | 'note' | 'exception';
  title: string;
  description?: string;
  timestamp: Date;
  actor: string;
  metadata?: Record<string, any>;
}

interface AdminTimelineProps {
  events: TimelineEvent[];
}

export function AdminTimeline({ events }: AdminTimelineProps) {
  const sortedEvents = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'creation': return <Circle className="h-4 w-4 text-primary-500 fill-primary-500" />;
      case 'status_change': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'receiving': return <Package className="h-4 w-4 text-blue-500" />;
      case 'note': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'exception': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Timeline & Audit Trail</h3>
      <div className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gray-100">
        {sortedEvents.map((event) => (
          <div key={event.id} className="relative pl-8">
            <div className="absolute left-0 top-1.5 z-10 flex h-4 w-4 items-center justify-center bg-white ring-4 ring-white">
              {getIcon(event.type)}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-gray-900">{event.title}</p>
                <span className="text-[10px] font-medium text-gray-400">{formatShortDate(event.timestamp)}</span>
              </div>
              {event.description && (
                <p className="text-xs text-gray-500 leading-relaxed">{event.description}</p>
              )}
              <div className="mt-1 flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-2 w-2 text-gray-400" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{event.actor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
