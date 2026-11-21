import { Link } from "@tanstack/react-router";
import { useStudio } from "@/config/studio";
import { useStudioContent } from "@/lib/studio-content";
import { images } from "@/lib/images";
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
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="Kahani Photography Home">
              <img
                src={images.logo}
                alt="Kahani Photography Logo"
                width={180}
                height={62}
                className="h-10 w-auto max-w-[200px] object-contain sm:h-12"
              />
            </Link>
            <div className="flex items-center gap-2 border-l border-paper/20 pl-3">
              <a
                aria-label="Instagram"
                href={studio.social.instagram}
                target="_blank"
                rel="noreferrer"
                title="Instagram"
                className="transition-opacity hover:opacity-80"
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
                aria-label="YouTube"
                href={studio.social.youtube}
                target="_blank"
                rel="noreferrer"
                title="YouTube"
                className="transition-opacity hover:opacity-80"
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
          <p className="mt-2 font-editorial italic text-taupe">{studio.tagline}</p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed">
            A photography & cinematography studio telling honest, timeless stories across India.
          </p>
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
            {categories.slice(0, 10).map((c) => (
              <li key={c.id}>
                <Link to="/services" hash={c.slug} className="hover:text-paper">
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
      <div className="border-t border-paper/20">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-paper/70 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {studio.name}. All rights reserved.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <p>
              Designed &amp; Developed by{" "}
              <a
                href="https://rootmile.com"
                target="_blank"
                rel="noopener"
                className="hover:text-paper hover:underline"
              >
                Rootmile Technologies
              </a>
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
      </div>
    </footer>
  );
}
