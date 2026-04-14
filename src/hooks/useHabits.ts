import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Habit {
  id: string;
  name: string;
  completedDays: boolean[];
  imageUrl?: string;
}

export interface WeekHistory {
  weekKey: string;
  weekLabel: string;
  habits: Habit[];
  completionRate: number;
}

export const getWeekKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
};

export const getMonday = (date: Date = new Date()) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  d.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getWeekLabel = (date: Date = new Date()) => {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${formatDate(monday)} - ${formatDate(sunday)}`;
};

export const getWeekDates = () => {
  const monday = getMonday();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.getDate();
  });
};

const getDefaultHabits = (): Habit[] => [
  { id: "1", name: "Morning meditation", completedDays: Array(7).fill(false) },
  { id: "2", name: "Read 30 minutes", completedDays: Array(7).fill(false) },
  { id: "3", name: "Exercise", completedDays: Array(7).fill(false) },
];

export const calculateWeeklyStreak = (
  habitName: string,
  currentCompletedDays: boolean[],
  history: WeekHistory[]
): number => {
  const currentWeekCompleted = currentCompletedDays.filter(Boolean).length >= 5;
  if (!currentWeekCompleted) return 0;
  let streak = 1;
  const sortedHistory = [...history].sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  for (const week of sortedHistory) {
    const habit = week.habits.find((h) => h.name === habitName);
    if (habit && habit.completedDays.filter(Boolean).length >= 5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<WeekHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const currentWeekKey = getWeekKey();

  // Load from database
  const loadFromDb = useCallback(async () => {
    if (!user) return;
    try {
      // Load habits
      const { data: dbHabits, error: habitsErr } = await supabase
        .from("habits")
        .select("id, name, image_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (habitsErr) throw habitsErr;

      if (!dbHabits || dbHabits.length === 0) {
        setHabits([]);
        setLoading(false);
        return;
      }

      // Load completions for current week
      const { data: completions, error: compErr } = await supabase
        .from("habit_completions")
        .select("habit_id, day_index")
        .eq("user_id", user.id)
        .eq("week_key", currentWeekKey);

      if (compErr) throw compErr;

      const completionMap = new Map<string, Set<number>>();
      (completions || []).forEach((c) => {
        if (!completionMap.has(c.habit_id)) completionMap.set(c.habit_id, new Set());
        completionMap.get(c.habit_id)!.add(c.day_index);
      });

      const loadedHabits: Habit[] = dbHabits.map((h) => ({
        id: h.id,
        name: h.name,
        completedDays: Array.from({ length: 7 }, (_, i) => completionMap.get(h.id)?.has(i) ?? false),
        imageUrl: h.image_url ?? undefined,
      }));

      setHabits(loadedHabits);

      // Load history (past weeks' completions)
      const { data: pastCompletions } = await supabase
        .from("habit_completions")
        .select("habit_id, week_key, day_index")
        .eq("user_id", user.id)
        .neq("week_key", currentWeekKey);

      if (pastCompletions && pastCompletions.length > 0) {
        const weekMap = new Map<string, Map<string, Set<number>>>();
        pastCompletions.forEach((c) => {
          if (!weekMap.has(c.week_key)) weekMap.set(c.week_key, new Map());
          const habitMap = weekMap.get(c.week_key)!;
          if (!habitMap.has(c.habit_id)) habitMap.set(c.habit_id, new Set());
          habitMap.get(c.habit_id)!.add(c.day_index);
        });

        const historyEntries: WeekHistory[] = Array.from(weekMap.entries())
          .map(([weekKey, habitMap]) => {
            const weekHabits: Habit[] = dbHabits
              .filter((h) => habitMap.has(h.id))
              .map((h) => ({
                id: h.id,
                name: h.name,
                completedDays: Array.from({ length: 7 }, (_, i) => habitMap.get(h.id)?.has(i) ?? false),
                imageUrl: h.image_url ?? undefined,
              }));

            const totalCompleted = weekHabits.reduce((acc, h) => acc + h.completedDays.filter(Boolean).length, 0);
            const totalPossible = weekHabits.length * 7;
            const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

            return { weekKey, weekLabel: weekKey, habits: weekHabits, completionRate };
          })
          .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
          .slice(0, 52);

        setHistory(historyEntries);
      }
    } catch (err) {
      console.error("Failed to load habits from database:", err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWeekKey]);

  // Load from localStorage (fallback for non-authenticated)
  const loadFromLocal = useCallback(() => {
    const saved = localStorage.getItem("habits");
    const savedWeekKey = localStorage.getItem("habitsWeekKey");

    if (saved && savedWeekKey) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (savedWeekKey !== currentWeekKey) {
            // Archive and reset
            const completionRate = parsed.length > 0
              ? Math.round((parsed.reduce((acc: number, h: Habit) => acc + h.completedDays.filter(Boolean).length, 0) / (parsed.length * 7)) * 100)
              : 0;
            const entry: WeekHistory = { weekKey: savedWeekKey, weekLabel: savedWeekKey, habits: parsed, completionRate };
            const existingHistory = localStorage.getItem("habitsHistory");
            let arr: WeekHistory[] = existingHistory ? JSON.parse(existingHistory) : [];
            if (!arr.some((h) => h.weekKey === savedWeekKey)) {
              arr.unshift(entry);
              arr = arr.slice(0, 52);
              localStorage.setItem("habitsHistory", JSON.stringify(arr));
            }
            setHistory(arr);
            const reset = parsed.map((h: Habit) => ({ ...h, completedDays: Array(7).fill(false) }));
            setHabits(reset);
            localStorage.setItem("habitsWeekKey", currentWeekKey);
            localStorage.setItem("habits", JSON.stringify(reset));
          } else {
            setHabits(parsed);
            const hist = localStorage.getItem("habitsHistory");
            setHistory(hist ? JSON.parse(hist) : []);
          }
          setLoading(false);
          return;
        }
      } catch {}
    }
    localStorage.setItem("habitsWeekKey", currentWeekKey);
    setHabits(getDefaultHabits());
    setLoading(false);
  }, [currentWeekKey]);

  // Initialize
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (user) {
      loadFromDb();
    } else {
      loadFromLocal();
    }
  }, [user, loadFromDb, loadFromLocal]);

  // Re-load when user changes
  useEffect(() => {
    if (!initializedRef.current) return;
    initializedRef.current = true;
    if (user) {
      setLoading(true);
      loadFromDb();
    } else {
      loadFromLocal();
    }
  }, [user?.id]);

  // Save to localStorage when not authenticated
  useEffect(() => {
    if (!user && !loading) {
      localStorage.setItem("habits", JSON.stringify(habits));
      localStorage.setItem("habitsHistory", JSON.stringify(history));
    }
  }, [habits, history, user, loading]);

  const handleToggle = useCallback(
    async (id: string, dayIndex: number) => {
      setHabits((prev) => {
        const updated = prev.map((h) =>
          h.id === id
            ? { ...h, completedDays: h.completedDays.map((c, i) => (i === dayIndex ? !c : c)) }
            : h
        );
        return updated;
      });

      if (user) {
        // Check current state to determine insert or delete
        const habit = habits.find((h) => h.id === id);
        if (!habit) return;
        const wasCompleted = habit.completedDays[dayIndex];

        if (wasCompleted) {
          await supabase
            .from("habit_completions")
            .delete()
            .eq("habit_id", id)
            .eq("week_key", currentWeekKey)
            .eq("day_index", dayIndex);
        } else {
          await supabase.from("habit_completions").insert({
            habit_id: id,
            user_id: user.id,
            week_key: currentWeekKey,
            day_index: dayIndex,
          });
        }
      }
    },
    [user, habits, currentWeekKey]
  );

  const handleAdd = useCallback(
    async (name: string, imageFile?: File) => {
      let imageUrl: string | undefined;

      if (user && imageFile) {
        const filePath = `${user.id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("habit-images")
          .upload(filePath, imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("habit-images")
            .getPublicUrl(filePath);
          imageUrl = urlData.publicUrl;
        }
      }

      if (user) {
        const { data, error } = await supabase
          .from("habits")
          .insert({ user_id: user.id, name, image_url: imageUrl ?? null })
          .select("id, name, image_url")
          .single();
        if (!error && data) {
          setHabits((prev) => [...prev, { id: data.id, name: data.name, completedDays: Array(7).fill(false), imageUrl: data.image_url ?? undefined }]);
        }
      } else {
        setHabits((prev) => [
          ...prev,
          { id: Date.now().toString(), name, completedDays: Array(7).fill(false) },
        ]);
      }
    },
    [user]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      if (user) {
        await supabase.from("habits").delete().eq("id", id);
      }
    },
    [user]
  );

  return { habits, history, loading, handleToggle, handleAdd, handleDelete };
}
