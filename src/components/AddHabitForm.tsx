import { useState, useRef } from "react";
import { Plus, ImagePlus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AddHabitFormProps {
  onAdd: (name: string, imageFile?: File) => void;
}

const AddHabitForm = ({ onAdd }: AddHabitFormProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be under 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), imageFile ?? undefined);
      setName("");
      clearImage();
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
    <form onSubmit={handleSubmit} className="slide-up space-y-3">
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
            clearImage();
          }}
          className="px-4 py-3 border-2 border-border rounded-lg
                     text-sm font-medium text-muted-foreground
                     hover:border-muted-foreground hover:text-foreground
                     transition-all duration-200"
        >
          Cancel
        </button>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-10 h-10 rounded-lg object-cover border border-border"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground text-background rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md border border-border hover:border-muted-foreground"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Add image
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default AddHabitForm;
