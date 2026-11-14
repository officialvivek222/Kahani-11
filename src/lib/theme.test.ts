import { describe, it, expect, beforeEach, vi } from "vitest";
import { applyTheme, getSystemTheme, themeScript } from "./theme";

describe("Theme system", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    localStorage.clear();
  });

  it("exports a valid FOUC prevention script", () => {
    expect(typeof themeScript).toBe("string");
    expect(themeScript).toContain("kahani-theme");
    expect(themeScript).toContain("dark");
  });

  it("applies dark class to documentElement when theme is dark", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from documentElement when theme is light", () => {
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("falls back to system preference when theme is system", () => {
    // Mock window.matchMedia
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("dark"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(getSystemTheme()).toBe("dark");
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    window.matchMedia = originalMatchMedia;
  });
});
