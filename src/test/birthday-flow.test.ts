import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_BLOW_MUSIC_SRC,
  SURPRISE_BIRTHDAY_MUSIC_SRC,
  canStartCelebration,
  getCakePhaseAtTime,
} from "@/lib/birthday-flow";

describe("birthday entry requirements", () => {
  it("requires a birthday type and a non-empty name before celebration", () => {
    expect(canStartCelebration(null, "Mina")).toBe(false);
    expect(canStartCelebration("girl", "   ")).toBe(false);
    expect(canStartCelebration("boy", "   ")).toBe(false);
  });

  it("allows either birthday type after a name is entered", () => {
    expect(canStartCelebration("girl", "Mina")).toBe(true);
    expect(canStartCelebration("boy", "Mina")).toBe(true);
  });
});

describe("cake countdown and candle blow timeline", () => {
  it("uses separate audio tracks for countdown/blow and the Happy Birthday surprise", () => {
    expect(COUNTDOWN_BLOW_MUSIC_SRC).toBe("/assets/aistudio/birthday_music_86bccdfd.mp3");
    expect(SURPRISE_BIRTHDAY_MUSIC_SRC).toBe(
      "/assets/aistudio/happy_birthday_phrase_4x_78ea5586.mp3",
    );
  });

  it("counts 4, 3, 2, 1 during the chimes before blowing out the candle at 3.7s", () => {
    expect(getCakePhaseAtTime(0)).toEqual({
      countdown: 4,
      candleOut: false,
      revealSurprise: false,
    });
    expect(getCakePhaseAtTime(900)).toEqual({
      countdown: 3,
      candleOut: false,
      revealSurprise: false,
    });
    expect(getCakePhaseAtTime(1800)).toEqual({
      countdown: 2,
      candleOut: false,
      revealSurprise: false,
    });
    expect(getCakePhaseAtTime(2700)).toEqual({
      countdown: 1,
      candleOut: false,
      revealSurprise: false,
    });
  });

  it("plays the candle blow-out at 3.7s and switches to Happy Birthday surprise at 6.25s", () => {
    expect(getCakePhaseAtTime(3700)).toEqual({
      countdown: 0,
      candleOut: true,
      revealSurprise: false,
    });
    expect(getCakePhaseAtTime(6250)).toEqual({
      countdown: 0,
      candleOut: true,
      revealSurprise: true,
    });
  });
});
