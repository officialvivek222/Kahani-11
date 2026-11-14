import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useStudio } from "@/config/studio";
import { useStudioContent } from "@/lib/studio-content";
import { navLinks } from "./Navbar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";

export function Footer() {
  const studio = useStudio();
  const { categories } = useStudioContent();
  const client = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ["studio-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
  return (
    <footer className="bg-charcoal text-paper/80">
      <div className="container-x grid gap-12 py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-[28px] tracking-[0.2em] text-paper">{studio.name}</p>
          <p className="mt-2 font-editorial italic text-taupe">{studio.tagline}</p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed">
            A photography & cinematography studio telling honest, timeless stories across India.
          </p>
          <div className="mt-6 flex gap-4">
            <a
              aria-label="Instagram"
              href={studio.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="hover:text-bronze"
            >
              <Instagram size={18} />
            </a>
            <a
              aria-label="Facebook"
              href={studio.social.facebook}
              target="_blank"
              rel="noreferrer"
              className="hover:text-bronze"
            >
              <Facebook size={18} />
            </a>
            <a
              aria-label="YouTube"
              href={studio.social.youtube}
              target="_blank"
              rel="noreferrer"
              className="hover:text-bronze"
            >
              <Youtube size={18} />
            </a>
          </div>
        </div>
        <div>
          <p className="eyebrow text-taupe">Explore</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-paper">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/quote" className="hover:text-paper">
                Get a Quote
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-taupe">Services</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {categories.slice(0, 7).map((c) => (
              <li key={c.id}>
                <Link to="/services" className="hover:text-paper">
                  {c.name.replace(" Photography", "")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow text-taupe">Studio</p>
          <address className="mt-5 space-y-2.5 text-sm not-italic">
            <p>{studio.address}</p>
            <p>
              <a href={`tel:${studio.phone.replace(/\s/g, "")}`} className="hover:text-paper">
                {studio.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${studio.email}`} className="hover:text-paper">
                {studio.email}
              </a>
            </p>
            <p>{studio.hours}</p>
          </address>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-paper/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {studio.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <ThemeToggle isTransparent className="size-8 text-paper/60 hover:text-paper" />
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/admin" className="hover:text-paper">
                  Studio dashboard
                </Link>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={async () => {
                    await client.cancelQueries();
                    client.clear();
                    await supabase.auth.signOut();
                    await navigate({ to: "/auth", replace: true });
                  }}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Link to="/auth" className="hover:text-paper">
                Studio login
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
