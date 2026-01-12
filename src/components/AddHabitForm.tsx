import { useState } from "react";
import { Plus } from "lucide-react";

interface AddHabitFormProps {
  onAdd: (name: string) => void;
}

const AddHabitForm = ({ onAdd }: AddHabitFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed border-border rounded-lg
                   flex items-center justify-center gap-2 text-muted-foreground
                   hover:border-muted-foreground hover:text-foreground
                   transition-all duration-200 group"
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
        <span className="text-sm font-medium">Add habit</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="slide-up">
      <div className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter habit name..."
          autoFocus
          className="flex-1 px-4 py-3 bg-background border-2 border-foreground rounded-lg
                     text-sm placeholder:text-muted-foreground
                     focus:outline-none focus:ring-0
                     transition-all duration-200"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-foreground text-background rounded-lg
                     text-sm font-medium hover:opacity-90
                     transition-all duration-200"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setName("");
          }}
          className="px-4 py-3 border-2 border-border rounded-lg
                     text-sm font-medium text-muted-foreground
                     hover:border-muted-foreground hover:text-foreground
                     transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddHabitForm;
