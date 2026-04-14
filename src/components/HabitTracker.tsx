import { useState, useRef } from "react";
import HabitItem from "./HabitItem";
import AddHabitForm from "./AddHabitForm";
import { History, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { triggerStreakCelebration, getMilestoneMessage } from "@/lib/streakCelebration";
import { toast } from "sonner";
import { useHabits, getWeekDates, getWeekLabel, calculateWeeklyStreak } from "@/hooks/useHabits";

const HabitTracker = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const { habits, history, loading, handleToggle, handleAdd, handleDelete } = useHabits();

  const weekDates = getWeekDates();
  const today = new Date();
  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const currentWeekLabel = getWeekLabel();

  const prevStreaksRef = useRef<Record<string, number>>({});

  const onToggle = (id: string, dayIndex: number) => {
    // Check for milestone streak after toggle
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      const newDays = habit.completedDays.map((c, i) => (i === dayIndex ? !c : c));
      const newStreak = calculateWeeklyStreak(habit.name, newDays, history);
      const prevStreak = prevStreaksRef.current[id] ?? 0;
      if (newStreak !== prevStreak) {
        prevStreaksRef.current[id] = newStreak;
        const message = getMilestoneMessage(newStreak);
        if (message) {
          setTimeout(() => {
            triggerStreakCelebration(newStreak);
            toast.success(message, { duration: 4000 });
          }, 100);
        }
      }
    }
    handleToggle(id, dayIndex);
  };

  const totalCompleted = habits.reduce((acc, h) => acc + h.completedDays.filter(Boolean).length, 0);
  const totalPossible = habits.length * 7;
  const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const dailyCompletion = Array.from({ length: 7 }, (_, dayIndex) => {
    const completed = habits.filter((h) => h.completedDays[dayIndex]).length;
    return habits.length > 0 ? (completed / habits.length) * 100 : 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading habits...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-12 fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{monthName}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                  showHistory ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <History className="w-3 h-3" />
                History
              </button>
              {user ? (
                <div className="flex items-center gap-1.5">
                  {user.user_metadata?.avatar_url && (
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-5 h-5 rounded-full" />
                  )}
                  <button
                    onClick={signOut}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  Sign in
                </button>
              )}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-1">Habits</h1>
          <p className="text-xs text-muted-foreground mb-4">{currentWeekLabel}</p>

          <div className="flex items-end justify-between gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-light">{completionRate}%</span>
              <span className="text-muted-foreground text-sm">this week</span>
            </div>
            {habits.length > 0 && (
              <div className="flex items-end gap-1.5 h-12 pb-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className="w-3 bg-primary rounded-sm transition-all duration-500"
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
                        {week.habits.length} habit{week.habits.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-end gap-0.5 h-6">
                        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                          const completed = week.habits.filter((h) => h.completedDays[dayIndex]).length;
                          const percentage = week.habits.length > 0 ? (completed / week.habits.length) * 100 : 0;
                          return (
                            <div
                              key={dayIndex}
                              className="w-1.5 bg-primary rounded-sm"
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
                <span className="text-[10px] text-muted-foreground font-medium">{date}</span>
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
                imageUrl={habit.imageUrl}
                onToggle={onToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        <AddHabitForm onAdd={handleAdd} />

        <footer className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">Build better habits, one day at a time</p>
        </footer>
      </div>
    </div>
  );
};

export default HabitTracker;
