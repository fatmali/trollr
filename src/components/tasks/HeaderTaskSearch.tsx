'use client';

import { useEffect, useRef, useState } from 'react';
import { useTaskStore } from '@/hooks/useTasks';
import { useLocalUser } from '@/context/LocalUserProvider';
import { Task } from '@/types';
import { TaskFormPopup } from './TaskPopups';

// Main HeaderTaskSearch component
const HeaderTaskSearch = () => {
  const { userId } = useLocalUser();
  const { getFilteredTasks } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Search for tasks when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      
      // Small timeout to avoid too frequent searches while typing
      const searchTimeout = setTimeout(() => {
        const results = getFilteredTasks({
          userId,
          searchQuery: searchQuery
        });
        
        setSearchResults(results);
        setIsSearching(false);
        setShowDropdown(true);
      }, 200);
      
      return () => clearTimeout(searchTimeout);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  }, [searchQuery, getFilteredTasks, userId]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Select a task and show details
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowDropdown(false);
    setSearchQuery('');
    setShowEditForm(true); // Set this to true when a task is selected
  };
  
  // Focus search input when clicking the search container
  const handleSearchContainerClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <>
      <div className="relative w-96" ref={searchContainerRef}>
        <div 
          className="flex items-center gap-2 py-1 px-2 transition-all w-full border border-gray-300 dark:border-gray-600 rounded-xl"
          onClick={handleSearchContainerClick}
        >
          {/* Search icon */}
          <svg 
            className="text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          
          {/* Search input */}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 border-none focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none text-sm font-medium text-gray-800 dark:text-gray-100 w-full transition-all caret-black dark:caret-white"
          />
          
          {/* Loading indicator or clear button */}
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-700 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
          ) : searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          ) : null}
        </div>
        
        {/* Search results dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-10 overflow-hidden max-h-[70vh] overflow-y-auto">
            <ul className="py-1">
              {searchResults.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => handleSelectTask(task)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      {/* Status indicator */}
                      <div className="flex-shrink-0 mr-2">
                        {task.status === 'completed' ? (
                          <svg className="w-4 h-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        ) : task.status === 'in_progress' ? (
                          <svg className="w-4 h-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"></path>
                          </svg>
                        ) : task.status === 'overdue' ? (
                          <svg className="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                        )}
                      </div>
                      
                      {/* Task title and details */}
                      <div className="overflow-hidden">
                        <div className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="capitalize">{task.priority} priority</span>
                          {task.tags.length > 0 && (
                            <span>• {task.tags.slice(0, 2).join(', ')}{task.tags.length > 2 ? '...' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* No results message */}
        {showDropdown && searchQuery.trim() && searchResults.length === 0 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-10 p-4 text-center text-gray-500 dark:text-gray-400">
            No tasks found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
      
      {/* Task edit form popup - Moved outside the relative container */}
      {selectedTask && showEditForm && (
        <TaskFormPopup
          userId={userId}
          initialTask={selectedTask}
          onSubmit={() => {
            setShowEditForm(false);
            setSelectedTask(null);
          }}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
};

export default HeaderTaskSearch;