import { useState, useEffect } from "react";
import HabitItem from "./HabitItem";
import AddHabitForm from "./AddHabitForm";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  completedDays: boolean[];
}

interface WeekHistory {
  weekKey: string;
  weekLabel: string;
  habits: Habit[];
  completionRate: number;
}

const getWeekKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

const getWeekLabel = (date: Date = new Date()) => {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${formatDate(monday)} - ${formatDate(sunday)}`;
};

const getMonday = (date: Date = new Date()) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  d.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekDates = () => {
  const monday = getMonday();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.getDate();
  });
};

const getDefaultHabits = (): Habit[] => [
  { id: "1", name: "Morning meditation", completedDays: [false, false, false, false, false, false, false] },
  { id: "2", name: "Read 30 minutes", completedDays: [false, false, false, false, false, false, false] },
  { id: "3", name: "Exercise", completedDays: [false, false, false, false, false, false, false] },
];

// Calculate weekly streak for a habit (consecutive weeks with 5+ days completed)
const calculateWeeklyStreak = (
  habitName: string, 
  currentCompletedDays: boolean[], 
  history: WeekHistory[]
): number => {
  const currentWeekCompleted = currentCompletedDays.filter(Boolean).length >= 5;
  if (!currentWeekCompleted) return 0;
  
  let streak = 1; // Current week counts
  
  // Sort history from most recent to oldest
  const sortedHistory = [...history].sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  
  for (const week of sortedHistory) {
    const habit = week.habits.find(h => h.name === habitName);
    if (habit) {
      const completedCount = habit.completedDays.filter(Boolean).length;
      if (completedCount >= 5) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  
  return streak;
};

const HabitTracker = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<WeekHistory[]>(() => {
    const saved = localStorage.getItem("habitsHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error('Failed to parse habits history:', error);
        localStorage.removeItem('habitsHistory');
      }
    }
    return [];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("habits");
    const savedWeekKey = localStorage.getItem("habitsWeekKey");
    const currentWeekKey = getWeekKey();

    if (saved && savedWeekKey) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Check if it's a new week
          if (savedWeekKey !== currentWeekKey) {
            // Save current data to history before resetting
            const completionRate = parsed.length > 0 
              ? Math.round((parsed.reduce((acc: number, h: Habit) => acc + h.completedDays.filter(Boolean).length, 0) / (parsed.length * 7)) * 100)
              : 0;
            
            const historyEntry: WeekHistory = {
              weekKey: savedWeekKey,
              weekLabel: getWeekLabel(getMonday(new Date(savedWeekKey.split('-W')[0] + '-01-01'))),
              habits: parsed,
              completionRate
            };

            // Load existing history and add new entry
            const existingHistory = localStorage.getItem("habitsHistory");
            let historyArray: WeekHistory[] = [];
            if (existingHistory) {
              try {
                historyArray = JSON.parse(existingHistory);
              } catch {}
            }
            
            // Only add if not already in history
            if (!historyArray.some(h => h.weekKey === savedWeekKey)) {
              historyArray.unshift(historyEntry);
              // Keep only last 12 weeks
              historyArray = historyArray.slice(0, 12);
              localStorage.setItem("habitsHistory", JSON.stringify(historyArray));
            }

            // Reset habits for new week (keep habit names, clear completions)
            const resetHabits = parsed.map((h: Habit) => ({
              ...h,
              completedDays: [false, false, false, false, false, false, false]
            }));
            localStorage.setItem("habitsWeekKey", currentWeekKey);
            return resetHabits;
          }
          return parsed;
        }
        console.error('Invalid habits data format in localStorage');
        localStorage.removeItem('habits');
        return getDefaultHabits();
      } catch (error) {
        console.error('Failed to parse habits from localStorage:', error);
        localStorage.removeItem('habits');
        return getDefaultHabits();
      }
    }
    
    // First time or no saved data
    localStorage.setItem("habitsWeekKey", currentWeekKey);
    return getDefaultHabits();
  });

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("habitsHistory", JSON.stringify(history));
  }, [history]);

  const weekDates = getWeekDates();
  const today = new Date();
  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const currentWeekLabel = getWeekLabel();

  const handleToggle = (id: string, dayIndex: number) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completedDays: habit.completedDays.map((completed, i) =>
                i === dayIndex ? !completed : completed
              ),
            }
          : habit
      )
    );
  };

  const handleAdd = (name: string) => {
    setHabits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        completedDays: [false, false, false, false, false, false, false],
      },
    ]);
  };

  const handleDelete = (id: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
  };

  const totalCompleted = habits.reduce(
    (acc, habit) => acc + habit.completedDays.filter(Boolean).length,
    0
  );
  const totalPossible = habits.length * 7;
  const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Calculate daily completion for the week overview chart
  const dailyCompletion = Array.from({ length: 7 }, (_, dayIndex) => {
    const completed = habits.filter((h) => h.completedDays[dayIndex]).length;
    return habits.length > 0 ? (completed / habits.length) * 100 : 0;
  });

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-12 fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {monthName}
            </p>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                showHistory 
                  ? "bg-foreground text-background" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <History className="w-3 h-3" />
              History
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-1">
            Habits
          </h1>
          <p className="text-xs text-muted-foreground mb-4">{currentWeekLabel}</p>
          
          {/* Stats row */}
          <div className="flex items-end justify-between gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-light">{completionRate}%</span>
              <span className="text-muted-foreground text-sm">this week</span>
            </div>

            {/* Weekly overview mini chart */}
            {habits.length > 0 && (
              <div className="flex items-end gap-1.5 h-12 pb-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className="w-3 bg-foreground rounded-sm transition-all duration-500"
                      style={{
                        height: `${Math.max(4, (dailyCompletion[index] / 100) * 32)}px`,
                        opacity: dailyCompletion[index] > 0 ? 1 : 0.2,
                      }}
                    />
                    <span className="text-[8px] text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* History Panel */}
        {showHistory && (
          <div className="mb-8 p-4 border border-border rounded-lg fade-in">
            <h2 className="text-sm font-medium mb-4">Past Weeks</h2>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet. Complete a week to see it here.</p>
            ) : (
              <div className="space-y-3">
                {history.map((week) => (
                  <div key={week.weekKey} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{week.weekLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {week.habits.length} habit{week.habits.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-end gap-0.5 h-6">
                        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                          const completed = week.habits.filter(h => h.completedDays[dayIndex]).length;
                          const percentage = week.habits.length > 0 ? (completed / week.habits.length) * 100 : 0;
                          return (
                            <div
                              key={dayIndex}
                              className="w-1.5 bg-foreground rounded-sm"
                              style={{
                                height: `${Math.max(2, (percentage / 100) * 20)}px`,
                                opacity: percentage > 0 ? 1 : 0.2,
                              }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-lg font-light w-12 text-right">{week.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Week indicator */}
        <div className="flex justify-end mb-2 pr-14">
          <div className="flex items-center gap-2">
            {weekDates.map((date, index) => (
              <div key={index} className="w-8 text-center">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Habits list */}
        <div className="mb-8">
          {habits.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground fade-in">
              <p className="text-lg font-light">No habits yet</p>
              <p className="text-sm mt-1">Add your first habit to get started</p>
            </div>
          ) : (
            habits.map((habit) => (
              <HabitItem
                key={habit.id}
                id={habit.id}
                name={habit.name}
                completedDays={habit.completedDays}
                weeklyStreak={calculateWeeklyStreak(habit.name, habit.completedDays, history)}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Add habit form */}
        <AddHabitForm onAdd={handleAdd} />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Build better habits, one day at a time
          </p>
        </footer>
      </div>
    </div>
  );
};

export default HabitTracker;
