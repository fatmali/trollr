'use client';

import { CircularProgress } from '@/components/ui/CircularProgress';
import { Card } from '@/components/ui/Card';
import { useTaskStore } from '@/hooks/useTasks';
import { usePomodoro } from '@/hooks/usePomodoro';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { useLocalUser } from '@/context/LocalUserProvider';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Task } from '@/types';

// Time period types
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'annual';

// Info tooltip component
const InfoTooltip = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block ml-2">
      <span 
        className="text-muted-foreground hover:text-foreground cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      </span>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 mt-1 text-xs bg-background border border-border rounded shadow-lg -left-32 top-5">
          {text}
        </div>
      )}
    </div>
  );
};

export default function AnalyticsPage() {
  const { userId } = useLocalUser();
  const { tasks } = useTaskStore();
  const { sessions } = usePomodoro();
  const [activeTab, setActiveTab] = useState<TimePeriod>('weekly');
  
  // General stats
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    overdue: 0,
    total: 0,
    completionRate: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });
  
  // Time period specific data
  const [timeActivityData, setTimeActivityData] = useState<Array<any>>([]);
  const [productivityScore, setProductivityScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pomodoroStats, setPomodoroStats] = useState({
    total: 0,
    completed: 0,
    abandoned: 0,
    totalFocusTime: 0,
    totalBreakTime: 0,
    completionRate: 0,
    averageDailyPomodoros: 0
  });
  const [tagDistribution, setTagDistribution] = useState<Array<{name: string, value: number}>>([]);
  const [productivityTrend, setProductivityTrend] = useState<Array<{date: string, score: number}>>([]);

  useEffect(() => {
    // Only consider tasks that belong to the current user
    const userTasks = tasks.filter(task => task.userId === userId);
    const userSessions = sessions.filter(session => session.userId === userId);
    
    // Calculate task statistics
    const completed = userTasks.filter(task => task.status === 'completed').length;
    const inProgress = userTasks.filter(task => task.status === 'in_progress').length;
    const notStarted = userTasks.filter(task => task.status === 'not_started').length;
    const overdue = userTasks.filter(task => task.status === 'overdue').length;
    const total = userTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Priority breakdown
    const highPriority = userTasks.filter(task => task.priority === 'high').length;
    const mediumPriority = userTasks.filter(task => task.priority === 'medium').length;
    const lowPriority = userTasks.filter(task => task.priority === 'low').length;

    setTaskStats({
      completed,
      inProgress,
      notStarted,
      overdue,
      total,
      completionRate,
      highPriority,
      mediumPriority,
      lowPriority
    });

    // Calculate pomodoro statistics
    const totalPomodoros = userSessions.length;
    const completedPomodoros = userSessions.filter(session => session.status === 'completed').length;
    const abandonedPomodoros = userSessions.filter(session => session.status === 'abandoned').length;
    const totalFocusTime = Math.round(completedPomodoros * 25); // 25 minutes per pomodoro
    const totalBreakTime = Math.round(completedPomodoros * 5); // 5 minutes break per pomodoro
    const pomodoroCompletionRate = totalPomodoros > 0 ? Math.round((completedPomodoros / totalPomodoros) * 100) : 0;

    // Calculate daily average (across days with at least one pomodoro)
    const sessionDates = new Set(userSessions.map(session => {
      const date = new Date(session.startedAt);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }));
    const averageDailyPomodoros = sessionDates.size > 0 ? Math.round(completedPomodoros / sessionDates.size * 10) / 10 : 0;

    setPomodoroStats({
      total: totalPomodoros,
      completed: completedPomodoros,
      abandoned: abandonedPomodoros,
      totalFocusTime,
      totalBreakTime,
      completionRate: pomodoroCompletionRate,
      averageDailyPomodoros
    });

    // Generate productivity score (weighted average of various metrics)
    const taskCompletionWeight = 0.4;
    const pomodoroCompletionWeight = 0.4;
    const highPriorityCompletionWeight = 0.2;

    // Calculate high priority completed tasks
    const completedHighPriorityTasks = userTasks.filter(task => 
      task.status === 'completed' && task.priority === 'high'
    ).length;
    const highPriorityTotal = userTasks.filter(task => task.priority === 'high').length;
    const highPriorityCompletionRate = highPriorityTotal > 0 ? completedHighPriorityTasks / highPriorityTotal : 0;

    const currentScore = Math.round(
      (completionRate * taskCompletionWeight) + 
      (pomodoroCompletionRate * pomodoroCompletionWeight) + 
      (highPriorityCompletionRate * 100 * highPriorityCompletionWeight)
    );
    
    setProductivityScore(currentScore);
    
    // Calculate tag distribution for completed tasks
    const tagCounts: Record<string, number> = {};
    userTasks
      .filter(task => task.status === 'completed')
      .forEach(task => {
        task.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
    
    const tagData = Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 tags
    
    setTagDistribution(tagData);

    // Calculate streak (consecutive days with completed tasks)
    calculateStreak(userTasks);
    
    // Update time-specific data based on active tab
    updateTimeActivityData(activeTab, userTasks, userSessions);
    
    // Generate productivity trend for the last 7 days/weeks/months depending on activeTab
    generateProductivityTrend(activeTab, userTasks, userSessions);
    
  }, [tasks, sessions, userId, activeTab]);

  // Function to calculate streak of consecutive days with completed tasks
  const calculateStreak = (userTasks: Task[]) => {
    const completedTasksByDate: Record<string, boolean> = {};
    
    // Get all dates with completed tasks
    userTasks
      .filter(task => task.status === 'completed' && task.completedAt)
      .forEach(task => {
        const date = new Date(task.completedAt!);
        const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        completedTasksByDate[dateString] = true;
      });
    
    let currentStreak = 0;
    const today = new Date();
    
    // Check for consecutive days, starting from today and going backwards
    for (let i = 0; i < 100; i++) { // Limit to 100 days to avoid infinite loop
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
      
      if (completedTasksByDate[dateString]) {
        currentStreak++;
      } else if (i > 0) { // If day is missed (except today), break the streak
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  // Update activity data based on selected time period
  const updateTimeActivityData = (period: TimePeriod, userTasks: Task[], userSessions: any[]) => {
    const now = new Date();
    let data: any[] = [];
    
    if (period === 'daily') {
      // Hourly breakdown for today
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hourlyData = Array(24).fill(0).map((_, i) => ({
        hour: i,
        tasks: 0,
        pomodoros: 0
      }));
      
      // Count tasks completed today by hour
      userTasks
        .filter(task => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate >= today;
        })
        .forEach(task => {
          const completedDate = new Date(task.completedAt!);
          const hour = completedDate.getHours();
          hourlyData[hour].tasks++;
        });
      
      // Count pomodoros completed today by hour
      userSessions
        .filter(session => {
          if (!session.actualEndAt) return false;
          const endDate = new Date(session.actualEndAt);
          return endDate >= today && session.status === 'completed';
        })
        .forEach(session => {
          const endDate = new Date(session.actualEndAt);
          const hour = endDate.getHours();
          hourlyData[hour].pomodoros++;
        });
        
      // Format for display
      data = hourlyData.map((item, i) => ({
        name: `${i}:00`,
        Tasks: item.tasks,
        Pomodoros: item.pomodoros
      }));
      
    } else if (period === 'weekly') {
      // Daily breakdown for current week
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start from Sunday
      weekStart.setHours(0, 0, 0, 0);
      
      const dailyData = Array(7).fill(0).map((_, i) => ({
        day: dayNames[i],
        date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
        tasks: 0,
        pomodoros: 0
      }));

      // Count tasks completed this week by day
      userTasks
        .filter(task => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate >= weekStart;
        })
        .forEach(task => {
          const completedDate = new Date(task.completedAt!);
          const dayOfWeek = completedDate.getDay(); // 0 for Sunday
          dailyData[dayOfWeek].tasks++;
        });
      
      // Count pomodoros completed this week by day
      userSessions
        .filter(session => {
          if (!session.actualEndAt) return false;
          const endDate = new Date(session.actualEndAt);
          return endDate >= weekStart && session.status === 'completed';
        })
        .forEach(session => {
          const endDate = new Date(session.actualEndAt);
          const dayOfWeek = endDate.getDay();
          dailyData[dayOfWeek].pomodoros++;
        });
        
      // Format for chart
      data = dailyData.map(item => ({
        name: item.day,
        Tasks: item.tasks,
        Pomodoros: item.pomodoros
      }));
      
    } else if (period === 'monthly') {
      // Weekly breakdown for current month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const weeksCount = Math.ceil(daysInMonth / 7);
      
      const weeklyData = Array(weeksCount).fill(0).map((_, i) => ({
        week: `Week ${i + 1}`,
        startDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 + (i * 7)),
        endDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(daysInMonth, (i + 1) * 7)),
        tasks: 0,
        pomodoros: 0
      }));
      
      // Count tasks completed this month by week
      userTasks
        .filter(task => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate.getMonth() === now.getMonth() && 
                 completedDate.getFullYear() === now.getFullYear();
        })
        .forEach(task => {
          const completedDate = new Date(task.completedAt!);
          const day = completedDate.getDate();
          const weekIndex = Math.floor((day - 1) / 7);
          weeklyData[weekIndex].tasks++;
        });
        
      // Count pomodoros completed this month by week
      userSessions
        .filter(session => {
          if (!session.actualEndAt) return false;
          const endDate = new Date(session.actualEndAt);
          return endDate.getMonth() === now.getMonth() && 
                 endDate.getFullYear() === now.getFullYear() && 
                 session.status === 'completed';
        })
        .forEach(session => {
          const endDate = new Date(session.actualEndAt);
          const day = endDate.getDate();
          const weekIndex = Math.floor((day - 1) / 7);
          weeklyData[weekIndex].pomodoros++;
        });
        
      // Format for chart
      data = weeklyData.map(item => ({
        name: item.week,
        Tasks: item.tasks,
        Pomodoros: item.pomodoros
      }));
      
    } else if (period === 'annual') {
      // Monthly breakdown for current year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearStart = new Date(now.getFullYear(), 0, 1);
      
      const monthlyData = Array(12).fill(0).map((_, i) => ({
        month: monthNames[i],
        tasks: 0,
        pomodoros: 0
      }));
      
      // Count tasks completed this year by month
      userTasks
        .filter(task => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate.getFullYear() === now.getFullYear();
        })
        .forEach(task => {
          const completedDate = new Date(task.completedAt!);
          const month = completedDate.getMonth();
          monthlyData[month].tasks++;
        });
        
      // Count pomodoros completed this year by month
      userSessions
        .filter(session => {
          if (!session.actualEndAt) return false;
          const endDate = new Date(session.actualEndAt);
          return endDate.getFullYear() === now.getFullYear() && 
                 session.status === 'completed';
        })
        .forEach(session => {
          const endDate = new Date(session.actualEndAt);
          const month = endDate.getMonth();
          monthlyData[month].pomodoros++;
        });
        
      // Format for chart
      data = monthlyData.map(item => ({
        name: item.month,
        Tasks: item.tasks,
        Pomodoros: item.pomodoros
      }));
    }
    
    setTimeActivityData(data);
  };

  // Generate productivity trend data
  const generateProductivityTrend = (period: TimePeriod, userTasks: Task[], userSessions: any[]) => {
    const now = new Date();
    let trendData: Array<{date: string, score: number}> = [];
    const calculateDailyScore = (tasks: Task[], sessions: any[], day: Date) => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
      
      // Tasks completed on this day
      const dayTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      });
      
      // Pomodoros completed on this day
      const dayPomodoros = sessions.filter(session => {
        if (!session.actualEndAt) return false;
        const endDate = new Date(session.actualEndAt);
        return endDate >= dayStart && endDate <= dayEnd && session.status === 'completed';
      });
      
      const taskCount = dayTasks.length;
      const pomodoroCount = dayPomodoros.length;
      
      // Simple scoring formula
      return Math.min(100, taskCount * 10 + pomodoroCount * 5);
    };
    
    if (period === 'daily') {
      // Show last 24 hours in 2-hour intervals
      for (let i = 0; i < 24; i += 2) {
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        
        // Calculate real score for this 2-hour period
        const periodStart = new Date(time);
        periodStart.setHours(time.getHours() - 2);
        
        const periodTasks = userTasks.filter(task => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate >= periodStart && completedDate <= time;
        });
        
        const periodPomodoros = userSessions.filter(session => {
          if (!session.actualEndAt) return false;
          const endDate = new Date(session.actualEndAt);
          return endDate >= periodStart && endDate <= time && session.status === 'completed';
        });
        
        const periodScore = Math.min(100, periodTasks.length * 10 + periodPomodoros.length * 5);
        const hourStr = `${time.getHours()}:00`;
        
        trendData.unshift({
          date: hourStr,
          score: periodScore
        });
      }
    } else if (period === 'weekly') {
      // Show last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        
        const score = calculateDailyScore(userTasks, userSessions, date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        
        trendData.push({
          date: dateStr,
          score: score
        });
      }
    } else if (period === 'monthly') {
      // Show last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7 + now.getDay()));
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        let weeklyScore = 0;
        for (let j = 0; j < 7; j++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + j);
          weeklyScore += calculateDailyScore(userTasks, userSessions, day);
        }
        
        const dateStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        trendData.push({
          date: `Week of ${dateStr}`,
          score: Math.round(weeklyScore / 7)
        });
      }
    } else if (period === 'annual') {
      // Show last 6 months using real data
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Get tasks and pomodoros for this month to calculate real score
        const monthTasks = userTasks.filter(task => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          return completedDate.getMonth() === monthDate.getMonth() && 
                 completedDate.getFullYear() === monthDate.getFullYear();
        });
        
        const monthPomodoros = userSessions.filter(session => {
          if (!session.actualEndAt) return false;
          const endDate = new Date(session.actualEndAt);
          return endDate.getMonth() === monthDate.getMonth() && 
                 endDate.getFullYear() === monthDate.getFullYear() && 
                 session.status === 'completed';
        });
        
        // Calculate score based on tasks and pomodoros
        const monthlyScore = Math.min(100, monthTasks.length * 5 + monthPomodoros.length * 2);
        
        trendData.push({
          date: monthNames[monthDate.getMonth()],
          score: monthlyScore
        });
      }
    }
    
    setProductivityTrend(trendData);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-md">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Analytics', href: '/analytics', isActive: true }
        ]} 
      />
      
      <div className="flex justify-between items-center mt-6 mb-8">
        <h1 className="text-3xl font-bold">Productivity Analytics</h1>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            onClick={() => setActiveTab('daily')}
          >
            Daily
          </button>
          <button 
            className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            onClick={() => setActiveTab('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            onClick={() => setActiveTab('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'annual' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            onClick={() => setActiveTab('annual')}
          >
            Annual
          </button>
        </div>
      </div>
      
      {/* Productivity Score & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 col-span-1 md:col-span-1">
          <h2 className="text-lg font-medium mb-2">
            Productivity Score
            <InfoTooltip text="Your overall productivity score based on task completion rate, pomodoro completion, and high-priority task progress. Higher score indicates better productivity." />
          </h2>
          <div className="flex justify-center mb-3">
            <CircularProgress 
              progress={productivityScore} 
              size={140} 
              strokeWidth={10}
              label={`${productivityScore}`}
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Your productivity level is {productivityScore >= 80 ? 'Excellent!' : productivityScore >= 60 ? 'Good!' : productivityScore >= 40 ? 'Average' : 'Needs improvement'}</p>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold">{streak}</span>
                <span className="text-sm text-muted-foreground">day{streak !== 1 ? 's' : ''} streak</span>
                <InfoTooltip text="Your current streak of consecutive days with completed tasks. Try to maintain and improve your streak every day!" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 col-span-1 md:col-span-2">
          <h2 className="text-lg font-medium mb-4">
            Productivity Trend
            <InfoTooltip text="This chart shows how your productivity score has changed over time. This helps you identify patterns and trends in your productivity levels." />
          </h2>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityTrend} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">
            Task Completion
            <InfoTooltip text="Shows your task completion rate as a percentage. This measures how many of your total tasks you have successfully completed." />
          </h2>
          <div className="flex justify-center mb-4">
            <CircularProgress 
              progress={taskStats.completionRate} 
              size={120} 
              strokeWidth={10} 
            />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>Completed {taskStats.completed} of {taskStats.total} tasks</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">
            Task Breakdown
            <InfoTooltip text="Visual breakdown of your tasks by status. Shows completed, in-progress, not started, and overdue tasks to help you understand your task distribution." />
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-medium">{taskStats.completed}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-black dark:bg-white h-2 rounded-full" 
                  style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">In Progress</span>
                <span className="text-sm font-medium">{taskStats.inProgress}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-black/70 dark:bg-white/70 h-2 rounded-full" 
                  style={{ width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Not Started</span>
                <span className="text-sm font-medium">{taskStats.notStarted}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-black/40 dark:bg-white/40 h-2 rounded-full" 
                  style={{ width: `${taskStats.total > 0 ? (taskStats.notStarted / taskStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Overdue</span>
                <span className="text-sm font-medium">{taskStats.overdue}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500/70 dark:bg-red-400/70 h-2 rounded-full" 
                  style={{ width: `${taskStats.total > 0 ? (taskStats.overdue / taskStats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">
            Pomodoro Stats
            <InfoTooltip text="Detailed statistics about your pomodoro sessions, including completed sessions, focus time, break time, and daily averages." />
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Sessions</span>
              <span className="font-medium">{pomodoroStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-medium">{pomodoroStats.completed} ({pomodoroStats.completionRate}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Abandoned</span>
              <span className="font-medium">{pomodoroStats.abandoned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Focus Time</span>
              <span className="font-medium">{pomodoroStats.totalFocusTime} mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Break Time</span>
              <span className="font-medium">{pomodoroStats.totalBreakTime} mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Daily Average</span>
              <span className="font-medium">{pomodoroStats.averageDailyPomodoros}</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Activity Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-6">
            {activeTab === 'daily' ? 'Today\'s Activity' : 
             activeTab === 'weekly' ? 'This Week\'s Activity' : 
             activeTab === 'monthly' ? 'This Month\'s Activity' : 'This Year\'s Activity'}
            <InfoTooltip text="This chart shows the number of tasks and pomodoros completed in the selected time period. Use this to identify your most productive times." />
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeActivityData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 20,
                }}
              >
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36}/>
                <Bar 
                  dataKey="Tasks" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="Pomodoros" 
                  fill="#82ca9d" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-6">
            Task Priority & Tags
            <InfoTooltip text="This chart shows the distribution of task priorities and the top tags for completed tasks. Use this to understand what types of tasks you're working on most." />
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {/* Priority Distribution */}
            <div className="h-36">
              <h3 className="text-sm font-medium mb-2">
                Priority Distribution
                <InfoTooltip text="Breakdown of your tasks by priority level (High, Medium, Low). Helps you see if you're focusing on important tasks." />
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'High', value: taskStats.highPriority },
                      { name: 'Medium', value: taskStats.mediumPriority },
                      { name: 'Low', value: taskStats.lowPriority }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'High', value: taskStats.highPriority },
                      { name: 'Medium', value: taskStats.mediumPriority },
                      { name: 'Low', value: taskStats.lowPriority }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Tag Distribution for Completed Tasks */}
            {tagDistribution.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-medium mb-4">
                  Top Tags (Completed Tasks)
                  <InfoTooltip text="Shows which tags appear most frequently in your completed tasks. This can help identify the categories of tasks you complete most often." />
                </h3>
                <div className="space-y-2">
                  {tagDistribution.map((tag, i) => (
                    <div key={tag.name} className="flex items-center">
                      <span className="w-24 text-xs truncate mr-2">{tag.name}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${(tag.value / tagDistribution[0].value) * 100}%`,
                            backgroundColor: COLORS[i % COLORS.length] 
                          }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs w-4 text-right">{tag.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Rewards and Achievements */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-6">
            Rewards & Achievements
            <InfoTooltip text="Gamified elements that track your progress and motivate you to improve your productivity habits. Complete achievements to level up!" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${streak >= 3 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                </svg>
              </div>
              <h3 className="font-medium text-sm">On Fire</h3>
              <p className="text-xs text-muted-foreground text-center">Complete tasks 3 days in a row</p>
              <p className="text-xs mt-2">{streak >= 3 ? 'Achieved!' : `${streak}/3 days`}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${taskStats.completed >= 10 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="font-medium text-sm">Task Master</h3>
              <p className="text-xs text-muted-foreground text-center">Complete 10 tasks</p>
              <p className="text-xs mt-2">{taskStats.completed >= 10 ? 'Achieved!' : `${taskStats.completed}/10 tasks`}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${pomodoroStats.completed >= 20 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="font-medium text-sm">Focus Champion</h3>
              <p className="text-xs text-muted-foreground text-center">Complete 20 pomodoro sessions</p>
              <p className="text-xs mt-2">{pomodoroStats.completed >= 20 ? 'Achieved!' : `${pomodoroStats.completed}/20 sessions`}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium mb-3">
              Your Level
              <InfoTooltip text="Your productivity level based on your overall performance. Progress through levels by improving your task and pomodoro completion rates." />
            </h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full"
                style={{ width: `${(taskStats.completionRate + pomodoroStats.completionRate) / 2}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Expert</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}