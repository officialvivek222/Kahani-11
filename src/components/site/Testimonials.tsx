import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useStudioContent } from "@/lib/studio-content";
export function Testimonials() {
  const { testimonials } = useStudioContent();
  const list = testimonials.filter((t) => t.published);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setI((x) => ((Number.isNaN(x) ? 0 : x) + 1) % list.length), 7000);
    return () => clearInterval(t);
  }, [list.length]);

  if (list.length === 0) return null;
  const safeIndex = i >= list.length || Number.isNaN(i) ? 0 : i;
  const t = list[safeIndex];
  if (!t) return null;
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.figure
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="flex justify-center gap-1 text-bronze"
              aria-label={`${t.rating} out of 5 stars`}
            >
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} size={14} className={k < t.rating ? "fill-current" : "opacity-30"} />
              ))}
            </div>
            <blockquote className="mt-6 font-display text-[clamp(24px,1.4rem+1vw,36px)] italic leading-snug">
              “{t.review}”
            </blockquote>
            <figcaption className="mt-8">
              <span className="font-medium">{t.name}</span>
              <span className="eyebrow ml-3 text-muted-foreground">{t.event}</span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          aria-label="Previous review"
          onClick={() => setI((safeIndex - 1 + list.length) % list.length)}
          className="border border-border p-3 hover:border-foreground"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="eyebrow text-muted-foreground">
          {String(safeIndex + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
        </span>
        <button
          aria-label="Next review"
          onClick={() => setI((safeIndex + 1) % list.length)}
          className="border border-border p-3 hover:border-foreground"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
