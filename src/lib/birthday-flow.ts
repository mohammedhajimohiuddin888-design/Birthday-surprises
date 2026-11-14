export type BirthdayType = "girl" | "boy";

export interface CakePhase {
  countdown: number;
  candleOut: boolean;
  revealSurprise: boolean;
}

export const BIRTHDAY_MUSIC_SRC = "/assets/aistudio/birthday_music_86bccdfd.mp3";

export function canStartCelebration(type: BirthdayType | null, name: string): boolean {
  return type !== null && name.trim().length > 0;
}

export function getCakePhaseAtTime(elapsedMs: number): CakePhase {
  if (elapsedMs < 900) {
    return { countdown: 4, candleOut: false, revealSurprise: false };
  }
  if (elapsedMs < 1800) {
    return { countdown: 3, candleOut: false, revealSurprise: false };
  }
  if (elapsedMs < 2700) {
    return { countdown: 2, candleOut: false, revealSurprise: false };
  }
  if (elapsedMs < 3700) {
    return { countdown: 1, candleOut: false, revealSurprise: false };
  }
  if (elapsedMs < 6350) {
    return { countdown: 0, candleOut: true, revealSurprise: false };
  }
  return { countdown: 0, candleOut: true, revealSurprise: true };
}
