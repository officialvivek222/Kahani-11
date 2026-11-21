import { Link } from "@tanstack/react-router";
import { images } from "@/lib/images";
import { btn } from "@/lib/ui";
import { waLink, useStudio } from "@/config/studio";
export function CtaBand() {
  const studio = useStudio();
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={images.cinema}
        alt="Cinematography and wedding shoot background"
        loading="lazy"
        width={1216}
        height={832}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-overlay/65" />
      <div className="container-x py-28 text-center text-paper lg:py-40">
        <p className="eyebrow text-taupe">Now booking 2026 – 27</p>
        <h2 className="text-section mx-auto mt-5 max-w-3xl">Let's Create Your Story Together</h2>
        <p className="mx-auto mt-5 max-w-lg text-paper/80">
          Tell us about your day. We'll reply with ideas, availability and a personal quotation.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/quote" className={btn("light")}>
            Get a Quote
          </Link>
          <a
            href={waLink(
              "Hello! I'd like to know more about your photography services.",
              studio.whatsapp,
            )}
            onClick={() =>
              window.__lovableEvents?.track?.("project.whatsapp_inquiry_clicked", { source: "cta" })
            }
            target="_blank"
            rel="noreferrer"
            className={btn("ghostLight")}
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
