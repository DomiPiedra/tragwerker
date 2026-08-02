import Link from "next/link";

const services = [
  { href: "/tragwerksplanung", label: "Tragwerksplanung" },
  { href: "/pruefung", label: "Prüfung" },
] as const;

export function SiteHomeServices() {
  return (
    <section className="site-container py-20 md:py-28 lg:py-32">
      <h2 className="mb-8 font-site-sans text-2xl font-extralight tracking-[-0.02em] text-[#b0b0b0] md:mb-10 md:text-[1.75rem] lg:text-3xl">
        Leistungen
      </h2>
      <div className="ml-0 space-y-1 md:ml-[18%] md:space-y-2 lg:ml-[28%] lg:space-y-3">
        {services.map((service) => (
          <Link
            key={service.href}
            href={service.href}
            className="block font-site-serif text-[2.25rem] leading-[1.08] tracking-[-0.02em] transition-opacity hover:opacity-60 md:text-[3.5rem] lg:text-[4.25rem]"
          >
            {service.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
