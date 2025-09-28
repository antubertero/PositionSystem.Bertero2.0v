import type { InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export const Label = ({ htmlFor, children }: { htmlFor: string; children: ReactNode }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
    {children}
  </label>
);

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={clsx(
      'w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
      className
    )}
    {...props}
  />
);

export const Select = ({ className, children, ...props }: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) => (
  <select
    className={clsx(
      'w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

export const ErrorText = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-danger">{message}</p> : null;
