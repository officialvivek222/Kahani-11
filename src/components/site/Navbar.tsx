import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStudio } from "@/config/studio";
import { images } from "@/lib/images";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/services", label: "Services" },
  { to: "/packages", label: "Packages" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const studio = useStudio();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [open]);
  const transparent = pathname === "/" && !scrolled && !open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        transparent
          ? "bg-transparent text-paper"
          : "border-b border-border bg-background/95 text-foreground backdrop-blur-sm",
      )}
    >
      <div className="container-x grid h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 xl:flex xl:h-[84px] xl:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 py-1"
            aria-label="Kahani Photography Home"
          >
            <img
              src={images.logo}
              alt="Kahani Photography Logo"
              width={160}
              height={55}
              className={cn(
                "h-8 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[190px]",
                transparent ? "block" : "hidden dark:block",
              )}
            />
            <img
              src={images.logoDark}
              alt="Kahani Photography Logo"
              width={160}
              height={55}
              className={cn(
                "h-8 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[190px]",
                transparent ? "hidden" : "block dark:hidden",
              )}
            />
          </Link>
          <div className="hidden shrink-0 items-center gap-1 border-l border-current/25 pl-2 sm:flex sm:gap-1.5 sm:pl-3">
            <a
              href={studio.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="rounded-full p-1 transition-opacity hover:opacity-80"
            >
              <img
                src={images.instagram}
                alt="Instagram"
                width={18}
                height={18}
                className="size-[18px] object-contain rounded-[4px]"
              />
            </a>
            <a
              href={studio.social.youtube}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className="rounded-full p-1 transition-opacity hover:opacity-80"
            >
              <img
                src={images.youtube}
                alt="YouTube"
                width={18}
                height={18}
                className="size-[18px] object-contain"
              />
            </a>
          </div>
        </div>
        <nav className="hidden items-center gap-7 xl:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="text-[13px] uppercase tracking-[0.16em] opacity-80 transition-opacity hover:opacity-100 data-[status=active]:opacity-100 data-[status=active]:underline data-[status=active]:underline-offset-8 data-[status=active]:decoration-bronze"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle isTransparent={transparent} />
          <Link
            to="/quote"
            className={cn(
              btn(transparent ? "ghostLight" : "solid"),
              "hidden px-5 py-2.5 sm:inline-flex",
            )}
          >
            Get a Quote
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="size-12 xl:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </Button>
        </div>
      </div>
      {open && (
        <div
          id="mobile-navigation"
          className="h-[calc(100dvh-72px)] overflow-y-auto border-t border-border bg-background xl:hidden"
        >
          <nav className="container-x flex flex-col py-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="eyebrow text-muted-foreground">Mode</span>
              <ThemeToggle />
            </div>
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="border-b border-border py-4 font-display text-[34px]"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/quote" className={cn(btn("solid"), "mt-8")}>
              Get a Quote
            </Link>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={studio.social.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex items-center gap-2 border border-border px-3.5 py-2 text-xs uppercase tracking-wider text-foreground hover:border-bronze hover:text-bronze"
              >
                <img
                  src={images.instagram}
                  alt="Instagram"
                  width={15}
                  height={15}
                  className="size-[15px] object-contain rounded-[3px]"
                />
                <span>Instagram</span>
              </a>
              <a
                href={studio.social.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="flex items-center gap-2 border border-border px-3.5 py-2 text-xs uppercase tracking-wider text-foreground hover:border-bronze hover:text-bronze"
              >
                <img
                  src={images.youtube}
                  alt="YouTube"
                  width={15}
                  height={15}
                  className="size-[15px] object-contain"
                />
                <span>YouTube</span>
              </a>
            </div>
            <p className="mt-6 break-words text-sm text-muted-foreground">
              {studio.phone}
              <br />
              {studio.email}
            </p>
          </nav>
        </div>
      )}
    </header>
  );
}
