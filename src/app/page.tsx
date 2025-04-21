'use client';

import React from 'react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';

export default function Home() {

  return (
    <div className="container px-4 py-4 mx-auto flex-1 flex flex-col md:flex-row gap-4">
      <div className={`flex-1 w-full`}>
        <KanbanBoard />
      </div>
    </div>
  );
}
