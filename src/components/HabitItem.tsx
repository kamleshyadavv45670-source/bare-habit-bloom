import { Check, X, Flame } from "lucide-react";
import { useState } from "react";

interface HabitItemProps {
  id: string;
  name: string;
  completedDays: boolean[];
  weeklyStreak?: number;
  onToggle: (id: string, dayIndex: number) => void;
  onDelete: (id: string) => void;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const MiniBarChart = ({ completedDays }: { completedDays: boolean[] }) => {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {completedDays.map((completed, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-300 ${
            completed ? "h-4 bg-foreground" : "h-1 bg-border"
          }`}
        />
      ))}
    </div>
  );
};

const HabitItem = ({ id, name, completedDays, weeklyStreak = 0, onToggle, onDelete }: HabitItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const daysCompleted = completedDays.filter(Boolean).length;
  const percentage = Math.round((daysCompleted / 7) * 100);

  return (
    <div
      className="group flex items-center justify-between py-5 px-1 border-b border-border fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tracking-tight">{name}</span>
            {weeklyStreak > 0 && (
              <div 
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                title={`${weeklyStreak} week${weeklyStreak > 1 ? 's' : ''} streak (5+ days/week)`}
              >
                <Flame className="w-3 h-3" />
                <span className="text-[10px] font-medium">{weeklyStreak}w</span>
              </div>
            )}
            <MiniBarChart completedDays={completedDays} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {daysCompleted}/7
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {DAYS.map((day, index) => (
          <button
            key={index}
            onClick={() => onToggle(id, index)}
            className="relative flex flex-col items-center gap-1"
          >
            <span className="text-[10px] text-muted-foreground font-medium">
              {day}
            </span>
            <div
              className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center
                transition-all duration-200 ease-out habit-check
                ${
                  completedDays[index]
                    ? "bg-foreground border-foreground habit-check-active"
                    : "border-border hover:border-muted-foreground"
                }
              `}
            >
              {completedDays[index] && (
                <Check className="w-4 h-4 text-background" strokeWidth={3} />
              )}
            </div>
          </button>
        ))}

        <button
          onClick={() => onDelete(id)}
          className={`
            ml-4 p-2 rounded-full transition-all duration-200
            ${isHovered ? "opacity-100" : "opacity-0"}
            hover:bg-muted
          `}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default HabitItem;
