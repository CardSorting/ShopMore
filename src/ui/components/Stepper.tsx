'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: { id: string; label: string }[];
  currentStepId: string;
  onStepClick?: (stepId: any) => void;
}

export function Stepper({ steps, currentStepId, onStepClick }: StepperProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <nav aria-label="Progress" className="mb-12">
      <ol role="list" className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className={`relative ${!isLast ? 'flex-1' : ''}`}>
              <div className="group flex flex-col items-center">
                <button
                  onClick={() => onStepClick?.(step.id)}
                  disabled={!isCompleted && !isCurrent}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 focus:outline-none"
                >
                  {isCompleted ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 shadow-lg shadow-primary-200">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-600 bg-white shadow-lg shadow-primary-100">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary-600 animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white group-hover:border-gray-300">
                      <span className="text-sm font-black text-gray-400 group-hover:text-gray-500">{index + 1}</span>
                    </div>
                  )}
                </button>
                
                <span className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div 
                  className="absolute left-[calc(50%+25px)] top-5 w-[calc(100%-50px)] h-0.5 bg-gray-100" 
                  aria-hidden="true"
                >
                  <div 
                    className="h-full bg-primary-600 transition-all duration-500 ease-in-out" 
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
