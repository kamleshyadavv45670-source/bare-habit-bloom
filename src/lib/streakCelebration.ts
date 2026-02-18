import confetti from "canvas-confetti";

const MILESTONES = [4, 8, 12];

export const isMilestoneStreak = (streak: number) => MILESTONES.includes(streak);

export const triggerStreakCelebration = (streak: number) => {
  if (!isMilestoneStreak(streak)) return;

  const colors =
    streak >= 12
      ? ["#FFD700", "#FFA500", "#FF6B6B"]
      : streak >= 8
      ? ["#A855F7", "#6366F1", "#EC4899"]
      : ["#22C55E", "#3B82F6", "#F59E0B"];

  // Burst from both sides
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.3, y: 0.5 },
    colors,
    scalar: 0.9,
  });

  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.7, y: 0.5 },
      colors,
      scalar: 0.9,
    });
  }, 150);

  if (streak >= 8) {
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x: 0.5, y: 0.3 },
        colors,
        scalar: 1.1,
        gravity: 0.8,
      });
    }, 300);
  }
};

export const getMilestoneMessage = (streak: number): string | null => {
  if (streak === 4) return "🔥 4-week streak! You're building a real habit!";
  if (streak === 8) return "⚡ 8-week streak! Incredible consistency!";
  if (streak === 12) return "🏆 12-week streak! You're unstoppable!";
  return null;
};
