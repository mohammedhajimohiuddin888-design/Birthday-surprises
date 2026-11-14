import { describe, expect, it } from "vitest";
import { canStartCelebration, getCakePhaseAtTime } from "@/lib/birthday-flow";

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
  it("counts 4, 3, 2, 1 before blowing out the candle at 3.7s", () => {
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

  it("blows out the candle at 3.7s and reveals the surprise at 6.35s", () => {
    expect(getCakePhaseAtTime(3700)).toEqual({
      countdown: 0,
      candleOut: true,
      revealSurprise: false,
    });
    expect(getCakePhaseAtTime(6350)).toEqual({
      countdown: 0,
      candleOut: true,
      revealSurprise: true,
    });
  });
});
