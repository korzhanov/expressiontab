import { describe, expect, it } from "bun:test";
import {
  isTimerVisible,
  nextTimerMode,
  parseTimerMode,
  TIMER_MODE_CLOCK,
  TIMER_MODE_COUNTDOWN,
  TIMER_MODE_HIDDEN,
} from "./timer-mode";

describe("timer-mode", () => {
  it("nextTimerMode cycles countdown → clock → hidden → countdown", () => {
    expect(nextTimerMode(TIMER_MODE_COUNTDOWN)).toBe(TIMER_MODE_CLOCK);
    expect(nextTimerMode(TIMER_MODE_CLOCK)).toBe(TIMER_MODE_HIDDEN);
    expect(nextTimerMode(TIMER_MODE_HIDDEN)).toBe(TIMER_MODE_COUNTDOWN);
  });

  it("isTimerVisible false only when hidden", () => {
    expect(isTimerVisible(TIMER_MODE_COUNTDOWN)).toBe(true);
    expect(isTimerVisible(TIMER_MODE_CLOCK)).toBe(true);
    expect(isTimerVisible(TIMER_MODE_HIDDEN)).toBe(false);
  });

  it("parseTimerMode accepts 0|1|2 else countdown", () => {
    expect(parseTimerMode("0")).toBe(0);
    expect(parseTimerMode("2")).toBe(2);
    expect(parseTimerMode("9")).toBe(TIMER_MODE_COUNTDOWN);
    expect(parseTimerMode(null)).toBe(TIMER_MODE_COUNTDOWN);
  });
});
