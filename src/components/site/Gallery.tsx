import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortfolioFilter, PortfolioItem } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const filters: ("All" | PortfolioFilter)[] = [
  "All",
  "Wedding",
  "Pre-Wedding",
  "Engagement",
  "Events",
  "Portraits",
];

export function Gallery({ items }: { items: PortfolioItem[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [index, setIndex] = useState<number | null>(null);
  const shown = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (d: number) => {
      if (shown.length === 0) {
        setIndex(null);
        return;
      }
      setIndex((i) => (i === null ? null : (i + d + shown.length) % shown.length));
    },
    [shown.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  const current =
    index !== null && index >= 0 && index < shown.length ? (shown[index] ?? null) : null;
  return (
    <div>
      <div className="mb-10 flex gap-6 overflow-x-auto border-b border-border pb-px">
        {filters.map((f) => (
          <Button
            variant="ghost"
            aria-pressed={filter === f}
            key={f}
            onClick={() => {
              setIndex(null);
              setFilter(f);
            }}
            className={cn(
              "-mb-px h-12 shrink-0 rounded-none border-b px-0 text-[13px] uppercase tracking-[0.16em] transition-colors",
              filter === f
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </Button>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No photographs found in this category.
        </p>
      )}
      <motion.div layout className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        <AnimatePresence mode="popLayout">
          {shown.map((item, i) => (
            <motion.button
              layout
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setIndex(i)}
              className="img-zoom group mb-5 block w-full break-inside-avoid text-left"
            >
              <div className="overflow-hidden">
                <img
                  src={item.image}
                  alt={`${item.title} — ${item.category}`}
                  loading="lazy"
                  className={cn(
                    "w-full object-cover",
                    item.ratio === "portrait" && "aspect-[4/5]",
                    item.ratio === "landscape" && "aspect-[3/2]",
                    item.ratio === "square" && "aspect-square",
                  )}
                />
              </div>
              <div className="mt-3 grid min-w-0 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline">
                <span className="min-w-0 break-words font-display text-[22px]">{item.title}</span>
                <span className="shrink-0 text-xs uppercase text-muted-foreground">
                  {item.category}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {current && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-overlay/95 text-paper"
            onClick={close}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="eyebrow text-taupe">
                {(index ?? 0) + 1} / {shown.length}
              </span>
              <button aria-label="Close" onClick={close} className="p-2">
                <X />
              </button>
            </div>
            <div
              className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                aria-label="Previous image"
                onClick={() => step(-1)}
                className="absolute left-2 z-10 p-3 opacity-70 hover:opacity-100 sm:left-6"
              >
                <ChevronLeft size={32} />
              </button>
              <motion.img
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={current.image}
                alt={current.title}
                className="max-h-[78vh] max-w-full object-contain"
              />
              <button
                aria-label="Next image"
                onClick={() => step(1)}
                className="absolute right-2 z-10 p-3 opacity-70 hover:opacity-100 sm:right-6"
              >
                <ChevronRight size={32} />
              </button>
            </div>
            <div className="pb-8 text-center" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-[28px]">{current.title}</p>
              <p className="eyebrow mt-1 text-taupe">
                {current.category} · {current.location}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
