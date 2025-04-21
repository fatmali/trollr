'use client';

import React from 'react';
import { useLocalUser } from '@/context/LocalUserProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProductivityScoreDisplay } from '@/components/ui/ProductivityScoreDisplay';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function SettingsPage() {
  const { 
    preferences, 
    updatePreferences, 
    stats,
  } = useLocalUser();
  
  const [trollIntensity, setTrollIntensity] = React.useState(preferences.trollIntensity);
  const [pomodoroDuration, setPomodoroDuration] = React.useState(preferences.pomodoroDuration);
  const [breakDuration, setBreakDuration] = React.useState(preferences.breakDuration);
  const [activeTab, setActiveTab] = React.useState('general');
  const [showExplanations, setShowExplanations] = React.useState(false);
  
  const handleSavePreferences = () => {
    updatePreferences({
      trollIntensity,
      pomodoroDuration,
      breakDuration
    });
  };
  
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Settings', isActive: true }
            ]}
          />
        </div>
        
        {/* Main content with tabs */}
        <div className="max-w-3xl mx-auto">
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('productivity')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'productivity'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Productivity
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'audio'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
               Music
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Statistics
            </button>
          </div>

          {/* About button */}
          <div className="flex justify-end mb-6">
            <button 
              onClick={() => setShowExplanations(!showExplanations)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {showExplanations ? 'Hide explanations' : 'Show explanations'}
            </button>
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">General Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Trollr Intensity (1-10)</label>
                  {showExplanations && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                      Controls how intensely the trollr messages respond to your productivity patterns. 
                      Lower values are more gentle, higher values are more direct.
                    </p>
                  )}
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={trollIntensity} 
                    onChange={(e) => setTrollIntensity(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Gentle</span>
                    <span>Moderate</span>
                    <span>Intense</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Productivity Tab */}
          {activeTab === 'productivity' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Pomodoro Settings</h2>
                
                {showExplanations && (
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md text-sm mb-6">
                    <h3 className="font-semibold mb-2">How is your productivity score calculated?</h3>
                    <p className="mb-2">Your productivity score is based on three main factors:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li><strong>Task completion ratio (40%):</strong> The percentage of tasks you complete vs. overdue tasks</li>
                      <li><strong>Pomodoro success ratio (40%):</strong> The percentage of Pomodoro sessions you complete without abandoning</li>
                      <li><strong>Streak bonus (up to 20%):</strong> Extra points based on your current streak of daily activity (max 10 days for full bonus)</li>
                    </ol>
                  </div>
                )}
                
                <div className="space-y-6">
                  {/* Pomodoro Duration Settings */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Pomodoro Duration (minutes)</label>
                    {showExplanations && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        The length of your focus sessions. The traditional Pomodoro Technique suggests 25 minutes, 
                        but you can customize based on your attention span and work needs.
                      </p>
                    )}
                    <div className="flex gap-4 items-center">
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={pomodoroDuration} 
                        onChange={(e) => setPomodoroDuration(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="min-w-[40px] text-center">{pomodoroDuration}</span>
                    </div>
                  </div>
                  
                  {/* Break Duration Settings */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Break Duration (minutes)</label>
                    {showExplanations && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        The length of your break between Pomodoro sessions. Short breaks help maintain focus 
                        without losing momentum. Traditional technique suggests 5 minutes.
                      </p>
                    )}
                    <div className="flex gap-4 items-center">
                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        step="1"
                        value={breakDuration} 
                        onChange={(e) => setBreakDuration(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="min-w-[40px] text-center">{breakDuration}</span>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Productivity Score</h2>
                  <ProductivityScoreDisplay size={70} />
                </div>
                
                {showExplanations && (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-xs mt-4 mb-2">
                    <p className="font-medium mb-1">Score breakdown:</p>
                    <ul className="space-y-1">
                      <li>
                        <span className="inline-block w-32">Task completion:</span>
                        <span className="font-medium">
                          {Math.round((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksOverdue || 1)) * 40)}% / 40%
                        </span>
                      </li>
                      <li>
                        <span className="inline-block w-32">Pomodoro success:</span>
                        <span className="font-medium">
                          {Math.round((stats.pomodorosCompleted / (stats.pomodorosCompleted + stats.pomodorosAbandoned || 1)) * 40)}% / 40%
                        </span>
                      </li>
                      <li>
                        <span className="inline-block w-32">Streak bonus:</span>
                        <span className="font-medium">
                          {Math.min(stats.currentStreak * 2, 20)}% / 20%
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">Music Settings</h2>
              
              {showExplanations && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Lofi music is known to improve focus and productivity. Use these controls to 
                  customize your music experience while working on tasks.
                </p>
              )}
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Enable Lofi Music</label>
                  <button 
                    onClick={() => updatePreferences({ lofiEnabled: !preferences.lofiEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.lofiEnabled ? 'bg-primary' : 'bg-slate-400 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.lofiEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Volume
                  </label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1"
                      value={preferences.lofiVolume || 50} 
                      onChange={(e) => updatePreferences({ lofiVolume: Number(e.target.value) })}
                      className="w-full accent-primary"
                      disabled={!preferences.lofiEnabled}
                    />
                    <span className="min-w-[40px] text-center">{preferences.lofiVolume || 50}%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preferred Station
                  </label>
                  <select
                    value={preferences.lofiStation || 'lofi-radio'}
                    onChange={(e) => updatePreferences({ lofiStation: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background"
                    disabled={!preferences.lofiEnabled}
                  >
                    <option value="lofi-radio">Lofi Radio</option>
                    <option value="chillhop">Chillhop</option>
                    <option value="jazz-hop">Jazz Hop</option>
                    <option value="synthwave">Synthwave</option>
                  </select>
                </div>
                
                {showExplanations && (
                  <p className="text-xs text-slate-500 mt-2">
                    All stations are streaming from free public sources. The audio will start playing 
                    when you click the play button in the player.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">Your Statistics</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
                  <div className="text-sm text-slate-500">Tasks Completed</div>
                  <div className="text-2xl font-semibold">{stats.tasksCompleted}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
                  <div className="text-sm text-slate-500">Current Streak</div>
                  <div className="text-2xl font-semibold">{stats.currentStreak} days</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
                  <div className="text-sm text-slate-500">Pomodoros Completed</div>
                  <div className="text-2xl font-semibold">{stats.pomodorosCompleted}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
                  <div className="text-sm text-slate-500">Longest Streak</div>
                  <div className="text-2xl font-semibold">{stats.longestStreak} days</div>
                </div>
              </div>
            </Card>
          )}

          {/* Save button */}
          <div className="mt-8">
            <Button onClick={handleSavePreferences} className="w-full">
              Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}