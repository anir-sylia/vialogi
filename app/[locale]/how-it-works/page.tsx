import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HOW_IT_WORKS } from "./dict";

type Props = {
  params: Promise<{ locale: string }>;
};

function clsIcon() {
  return "h-5 w-5 text-[var(--brand)]";
}

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const d = HOW_IT_WORKS[locale === "ar" ? "ar" : "fr"];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* 1) Hero */}
      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm sm:p-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand)] ring-1 ring-[var(--brand)]/15">
              ViaLogi
            </p>
            <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">
              {d.hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              {d.valueProp.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/post"
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                {d.hero.primaryCta}
              </Link>
              <Link
                href="/search-route"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--surface-muted)]"
              >
                {d.hero.secondaryCta}
              </Link>
            </div>
          </div>
          <div aria-hidden className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(13,148,136,0.25),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(2,132,199,0.18),transparent_55%)]" />
            <div className="relative rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {d.valueProp.stat}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {d.valueProp.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3) Profile Types */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          {d.profileTypes.title}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.profileTypes.cards.map((c) => (
            <li
              key={c.title}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
            >
              <c.icon className={clsIcon()} aria-hidden />
              <p className="mt-3 font-semibold text-[var(--text-primary)]">
                {c.title}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 4) Transporter Benefit */}
      <section className="mt-12 overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {d.transporterBenefit.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              {d.transporterBenefit.description}
            </p>
          </div>
          <div aria-hidden className="rounded-2xl bg-[var(--surface-muted)] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Alertes
                </p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Notifications en temps réel
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Offres
                </p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Faites une offre rapidement
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5) 1-2-3 Process */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          {d.process123.title}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {d.process123.steps.map((s, i) => (
            <li
              key={s.title}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <s.icon className={clsIcon()} aria-hidden />
                <span className="text-xs font-bold text-[var(--brand)]">
                  {i + 1}
                </span>
              </div>
              <p className="mt-3 font-semibold text-[var(--text-primary)]">
                {s.title}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 6) Trust Badges */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          {d.trustBadges.title}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {d.trustBadges.badges.map((b) => (
            <li
              key={b.title}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
            >
              <b.icon className={clsIcon()} aria-hidden />
              <p className="mt-3 font-semibold text-[var(--text-primary)]">
                {b.title}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 7) Pro Transporter */}
      <section className="mt-12 overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {d.proTransporter.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              {d.proTransporter.description}
            </p>
            <div className="mt-7">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                {d.proTransporter.cta}
              </Link>
            </div>
          </div>
          <div aria-hidden className="rounded-2xl bg-[var(--surface-muted)] p-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Pro
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                B2B · Transport · Déménagement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8) Testimonials */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          {d.testimonials.title}
        </h2>
        <ul className="mt-6 grid gap-4 lg:grid-cols-3">
          {d.testimonials.items.map((it) => (
            <li
              key={it.quote}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
            >
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                “{it.quote}”
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {it.author}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 9) Stats */}
      <section className="mt-12 overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          {d.stats.title}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {d.stats.items.map((s) => (
            <li
              key={s.label}
              className="rounded-2xl bg-[var(--surface-muted)] p-6"
            >
              <s.icon className={clsIcon()} aria-hidden />
              <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--brand)]">
                —
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 10) FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
          {d.faq.title}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {d.faq.items.map((it) => (
            <details
              key={it.q}
              className="group rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-primary)]">
                {it.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 11) Footer */}
      <footer className="mt-12 rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
          <div className="flex flex-wrap gap-4">
            <span className="font-medium text-[var(--text-primary)]">
              {d.footer.contact}
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              {d.footer.cgu}
            </span>
          </div>
          <span>{d.footer.language}</span>
        </div>
      </footer>
    </main>
  );
}

