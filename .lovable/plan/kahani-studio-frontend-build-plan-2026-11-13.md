# KAHANI STUDIO — Frontend Build Plan

Frontend only, mock data, no backend or real login yet (as the brief asks). "Warm Editorial Luxury" direction with the given palette and fonts.

## Public website

- **Shared:** sticky navbar (transparent over home hero, solid ivory on scroll), mobile menu, Get a Quote button, full footer.
- **Home (/):** full-screen hero, editorial intro, asymmetric categories collage (10 categories), "Stories We've Captured" masonry with filters + lightbox, Why Choose Us, Basic/Premium/Luxury packages, testimonial carousel, 6-image Instagram grid, cinematic CTA.
- **About (/about):** intro, philosophy, creative approach, specialties, CTA.
- **Portfolio (/portfolio):** filters, masonry, full-screen lightbox with prev/next and keyboard support.
- **Services (/services):** each service with cover image, description, inclusions, quote button.
- **Packages (/packages):** tabs for Wedding, Pre-Wedding, Birthday, Engagement, Events, Other.
- **Quote (/quote):** 5-step wizard (category → package → add-ons → event details → contact) with validation, live price breakdown, summary, WhatsApp click-to-chat with formatted message, email-inquiry button (shows a clear "not sent yet — backend coming" notice), estimate disclaimer.
- **Contact (/contact):** form (validated, honest "not yet delivered" notice), phone, WhatsApp, email, address, map placeholder, socials.

## Admin (separate look: charcoal sidebar, white cards)

- /admin/login (design only, no real sign-in), Dashboard stats + recent lists, Portfolio, Categories, Packages, Add-on Services, Inquiries (statuses, detail view, WhatsApp action), Quotations, Testimonials, Settings, Profile.
- Add/edit/delete work in-session only, with a visible note that changes reset on refresh.

## Images

- Generate ~16–20 original photographs (Indian weddings, couples, pre-wedding, maternity, baby, portraits, events, product) and reuse them across pages; all referenced from one central image file for later swap.

## Technical details

- TanStack Start file routes (the project's fixed router, in place of React Router), each with its own head() metadata.
- `src/config/studio.ts` (name, phone, WhatsApp, email, address, socials), `src/data/*` typed mock data, `src/types/*` models shaped like future database tables, `src/lib/quote.ts` pricing logic + WhatsApp message builder with unit tests.
- Tokens in styles.css (oklch versions of the palette), fonts via link tags, fluid clamp() type scale, max width 1440px, Framer Motion for subtle fades, lucide icons, lazy-loaded images.
- Admin under /admin layout route with its own shell.
