"use client";

import React from "react";
import { Task } from "@/types";
import { TaskForm } from "./TaskForm";
import Modal from 'react-modal';

// Set the app element for accessibility (this should ideally be in a higher-level component)
if (typeof window !== 'undefined') {
  Modal.setAppElement('body'); // In Next.js, we can use the body element
}

// Modal custom styles
const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '550px',
    width: '100%',
    maxHeight: '90vh',
    padding: '24px',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    overflow: 'auto',
    background: 'var(--background)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  }
};

// TaskDetailsPopup component - reusable popup for displaying task details
export const TaskDetailsPopup = ({ task, onClose }: { task: Task; onClose: () => void }) => {
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status display name
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'not_started': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  // Get priority badge styling
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'low':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      style={customModalStyles}
      contentLabel="Task Details"
      closeTimeoutMS={200}
    >
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      <h3 className="text-lg font-medium mb-4">{task.title}</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block">Status</span>
            <span className="font-medium">{getStatusDisplay(task.status)}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block">Priority</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Description</span>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
            {task.description || "No description provided."}
          </p>
        </div>

        {task.tags.length > 0 && (
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Tags</span>
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Created</span>
            <span>{formatDate(task.createdAt)}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Deadline</span>
            <span>{formatDate(task.deadline)}</span>
          </div>
        </div>

        {task.codeSnippet && (
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Code Snippet</span>
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded-md text-xs overflow-x-auto">
              {task.codeSnippet}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

// TaskFormPopup component for displaying the task form in a modal
export const TaskFormPopup = ({ 
  userId, 
  initialTask, 
  onSubmit, 
  onCancel 
}: { 
  userId: string; 
  initialTask?: Task; 
  onSubmit: () => void; 
  onCancel: () => void;
}) => {
  return (
    <Modal
      isOpen={true}
      onRequestClose={onCancel}
      style={customModalStyles}
      contentLabel="Task Form"
      closeTimeoutMS={200}
    >
      <button 
        onClick={onCancel}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <TaskForm
        userId={userId}
        initialTask={initialTask}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </Modal>
  );
};

// Custom confirmation dialog for pomodoro reset or other confirmations
export const ConfirmationDialog = ({ 
  message, 
  onConfirm, 
  onCancel 
}: { 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void;
}) => {
  return (
    <Modal
      isOpen={true}
      onRequestClose={onCancel}
      style={customModalStyles}
      contentLabel="Confirmation Dialog"
      closeTimeoutMS={200}
    >
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Confirmation</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
};