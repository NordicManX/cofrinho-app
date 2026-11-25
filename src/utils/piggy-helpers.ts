import { differenceInDays, parseISO } from "date-fns";

const VIBRANT_PALETTES = [
  ["#00F5A0", "#00D9F5", "#7000FF"], // Cyber Mint
  ["#FF0080", "#7928CA", "#FF4D4D"], // Neon Magenta
  ["#F59E0B", "#EC4899", "#8B5CF6"], // Sunset Glow
  ["#3B82F6", "#06B6D4", "#10B981"], // Ocean Pulse
  ["#A855F7", "#EC4899", "#F43F5E"], // Plasma Violet
];

export function generateMeshGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = VIBRANT_PALETTES[Math.abs(hash) % VIBRANT_PALETTES.length];
  const angle = Math.abs(hash) % 360;

  return {
    background: `radial-gradient(circle at 20% 20%, ${palette[0]}40, transparent 50%),
                 radial-gradient(circle at 80% 80%, ${palette[1]}35, transparent 50%),
                 linear-gradient(${angle}deg, ${palette[2]}20, transparent)`,
    accent: palette[0],
  };
}

export type PaceStatus = "completed" | "ahead" | "on_track" | "behind";

export function calculatePlanningMetrics(
  current: number,
  target: number,
  deadlineStr: string,
  createdAtStr?: string,
) {
  const remainingAmount = Math.max(target - current, 0);
  const now = new Date();
  const deadline = parseISO(deadlineStr);
  const daysLeft = Math.max(differenceInDays(deadline, now), 0);
  const progress = Math.min((current / target) * 100, 100);

  const dailyNeeded =
    daysLeft > 0 ? remainingAmount / daysLeft : remainingAmount;
  const monthlyNeeded =
    daysLeft > 30 ? remainingAmount / (daysLeft / 30.44) : remainingAmount;

  // Cálculo do ritmo (Pace)
  let paceStatus: PaceStatus = "on_track";
  let expectedProgress = 0;

  if (progress >= 100) {
    paceStatus = "completed";
  } else if (createdAtStr) {
    const created = parseISO(createdAtStr);
    const totalDays = Math.max(differenceInDays(deadline, created), 1);
    const elapsedDays = Math.max(differenceInDays(now, created), 0);
    expectedProgress = Math.min((elapsedDays / totalDays) * 100, 100);

    const diff = progress - expectedProgress;
    if (diff >= 5) paceStatus = "ahead";
    else if (diff < -5) paceStatus = "behind";
    else paceStatus = "on_track";
  }

  return {
    remainingAmount,
    daysLeft,
    progress,
    dailyNeeded,
    monthlyNeeded,
    paceStatus,
    expectedProgress,
  };
}
