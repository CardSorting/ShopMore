import React from 'react';

export function TextInput({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id?: string }) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
      <input id={inputId} data-testid={inputId} {...props} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500" />
    </div>
  );
}

export function MoneyInput({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id?: string }) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
        <input id={inputId} data-testid={inputId} {...props} type="number" step="0.01" className="w-full rounded-lg border bg-gray-50 py-2.5 pl-8 pr-4 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500" />
      </div>
    </div>
  );
}

export function TextArea({ label, id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id?: string }) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
      <textarea id={inputId} data-testid={inputId} {...props} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" />
    </div>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(event) => onChange(event.target.checked)} 
        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
      />
      {label}
    </label>
  );
}
