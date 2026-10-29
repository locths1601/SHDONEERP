import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BreadcrumbItem } from '../../types';

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs ${className}`}>
      <ol className="flex items-center space-x-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1 flex-shrink-0" />
              )}
              {isLast ? (
                <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  {item.icon && <span className="text-slate-500">{item.icon}</span>}
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none"
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </button>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
