import { Reveal } from "./Reveal";
export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="container-x pb-10 pt-28 sm:pb-14 sm:pt-36 lg:pb-20 lg:pt-48">
      <Reveal>
        <p className="eyebrow text-bronze">{eyebrow}</p>
        <h1 className="text-page mt-5 max-w-4xl">{title}</h1>
        {intro && <p className="mt-6 max-w-xl text-muted-foreground">{intro}</p>}
      </Reveal>
    </section>
  );
}
