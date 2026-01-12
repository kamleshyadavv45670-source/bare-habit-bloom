import { Check, X } from "lucide-react";
import { useState } from "react";

interface HabitItemProps {
  id: string;
  name: string;
  completedDays: boolean[];
  onToggle: (id: string, dayIndex: number) => void;
  onDelete: (id: string) => void;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const HabitItem = ({ id, name, completedDays, onToggle, onDelete }: HabitItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const streak = completedDays.filter(Boolean).length;

  return (
    <div
      className="group flex items-center justify-between py-5 px-1 border-b border-border fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col">
          <span className="text-sm font-medium tracking-tight">{name}</span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {streak}/7 this week
          </span>
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
