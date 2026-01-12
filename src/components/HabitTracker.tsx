import { useState, useEffect } from "react";
import HabitItem from "./HabitItem";
import AddHabitForm from "./AddHabitForm";

interface Habit {
  id: string;
  name: string;
  completedDays: boolean[];
}

const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.getDate();
  });
};

const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("habits");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: "1", name: "Morning meditation", completedDays: [true, true, true, false, false, false, false] },
      { id: "2", name: "Read 30 minutes", completedDays: [true, false, true, true, false, false, false] },
      { id: "3", name: "Exercise", completedDays: [false, true, false, true, false, false, false] },
    ];
  });

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  const weekDates = getWeekDates();
  const today = new Date();
  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

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

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-12 fade-in">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {monthName}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Habits
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-light">{completionRate}%</span>
            <span className="text-muted-foreground text-sm">this week</span>
          </div>
        </header>

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
