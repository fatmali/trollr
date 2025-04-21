'use client';

import Link from 'next/link';
import { useLocalUser } from '@/context/LocalUserProvider';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showStreak?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items,
  showStreak = true
}) => {
  const { stats } = useLocalUser();

  return (
    <div className="flex items-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <div className="text-muted-foreground mx-1">/</div>
          )}
          
          {item.href && !item.isActive ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.isActive ? "text-foreground font-medium" : "text-muted-foreground"}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
      
      {/* Streak indicator */}
      {showStreak && stats.currentStreak > 1 && (
        <div className="bg-orange-600/10 text-orange-500 dark:text-orange-400 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ml-3">
          <span className="text-orange-500">🔥</span> {stats.currentStreak} day streak
        </div>
      )}
    </div>
  );
};