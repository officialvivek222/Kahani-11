import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  isTransparent,
}: {
  className?: string;
  isTransparent?: boolean;
}) {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveIsDark = mounted ? isDark : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={effectiveIsDark ? "Switch to light mode" : "Switch to dark mode"}
      title={effectiveIsDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze",
        isTransparent
          ? "text-paper hover:bg-white/15"
          : "text-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {effectiveIsDark ? (
        <Sun className="size-[19px] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="size-[19px] transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
