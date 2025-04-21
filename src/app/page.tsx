'use client';

import React from 'react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { useLocalUser } from '@/context/LocalUserProvider';

export default function Home() {
  const { displayName, setDisplayName, stats } = useLocalUser();

  return (
    <div className="container px-4 py-4 mx-auto flex-1 flex flex-col md:flex-row gap-4">
      {/* Main content - Kanban board */}
      <div className={`flex-1 w-full`}>
        <KanbanBoard />
      </div>
    </div>
  );
}
