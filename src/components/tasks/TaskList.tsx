'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { Button } from '@/components/ui/Button';
import { useTaskStore } from '@/hooks/useTasks';
import { useLocalUser } from '@/context/LocalUserProvider';

export const TaskList: React.FC = () => {
  const { userId, stats, updateStats } = useLocalUser();
  const { 
    updateTask, 
    deleteTask, 
    completeTask, 
    getFilteredTasks,
  } = useTaskStore();
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  
  // Get all unique tags across tasks
  const allTasks = getFilteredTasks({ userId });
  const allTags = [...new Set(allTasks.flatMap(task => task.tags))];
  
  // Get filtered tasks
  const filteredTasks = getFilteredTasks({
    userId,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    priority: priorityFilter.length > 0 ? priorityFilter : undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
    searchQuery: searchQuery.length > 0 ? searchQuery : undefined,
  });
  
  const handleTaskSubmit = () => {  
    setIsFormVisible(false);
  };
  
  // Handle starting a pomodoro
  const handleStartPomodoro = (task: Task) => {
    // This is handled by the parent component
    window.dispatchEvent(
      new CustomEvent('start-pomodoro', { detail: { taskId: task.id } })
    );
  };
  
  // Handle task completion
  const handleCompleteTask = async (task: Task) => {
    const updatedTask = completeTask(task.id);
    
    if (updatedTask) {
      // Update user stats
      updateStats({
        tasksCompleted: stats.tasksCompleted + 1,
      });
      
    }
  };
  
  // Function to handle deleting a task
  const handleDeleteTask = (task: Task) => {
    deleteTask(task.id);
  };
  
  // Function to handle editing a task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormVisible(true);
  };
  
  // Function to toggle a status filter
  const toggleStatusFilter = (status: TaskStatus) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };
  
  // Function to toggle a priority filter
  const togglePriorityFilter = (priority: TaskPriority) => {
    setPriorityFilter(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority) 
        : [...prev, priority]
    );
  };
  
  // Function to toggle a tag filter
  const toggleTagFilter = (tag: string) => {
    setTagFilter(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  // Check for overdue tasks
  useEffect(() => {
    const checkOverdueTasks = () => {
      const now = new Date();
      let overdueCount = 0;
      
      allTasks.forEach(task => {
        if (
          task.status !== 'completed' && 
          task.status !== 'overdue' && 
          task.deadline && 
          new Date(task.deadline) < now
        ) {
          updateTask(task.id, { status: 'overdue' });
          overdueCount++;
        }
      });
      
      if (overdueCount > 0) {
        // Update user stats
        updateStats({
          tasksOverdue: stats.tasksOverdue + overdueCount,
        });
      }
    };
    
    // Check when component mounts
    checkOverdueTasks();
    
    // Set up an interval to check periodically
    const intervalId = setInterval(checkOverdueTasks, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [allTasks, updateTask, userId, stats, updateStats]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button
          onClick={() => {
            setEditingTask(undefined);
            setIsFormVisible(true);
          }}
        >
          Add Task
        </Button>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status filters */}
          <div>
            <h3 className="font-medium mb-2">Status</h3>
            <div className="flex flex-wrap gap-2">
              {(['not_started', 'in_progress', 'completed', 'overdue'] as TaskStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      statusFilter.includes(status)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>
          
          {/* Priority filters */}
          <div>
            <h3 className="font-medium mb-2">Priority</h3>
            <div className="flex flex-wrap gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => togglePriorityFilter(priority)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    priorityFilter.includes(priority)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tag filters */}
          {allTags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      tagFilter.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Task form */}
      {isFormVisible && (
        <div className="mb-6">
          <TaskForm
            userId={userId}
            initialTask={editingTask}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setIsFormVisible(false);
              setEditingTask(undefined);
            }}
          />
        </div>
      )}
      
      {/* Task list */}
      <div>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No tasks found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setEditingTask(undefined);
                setIsFormVisible(true);
              }}
            >
              Create your first task
            </Button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStartPomodoro={handleStartPomodoro}
              onComplete={handleCompleteTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
            />
          ))
        )}
      </div>
    </div>
  );
};