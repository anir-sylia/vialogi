import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

function StepCard({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-sm font-extrabold text-[var(--brand)] ring-1 ring-[var(--brand)]/15">
        {n}
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
          {desc}
        </p>
      </div>
    </li>
  );
}

export async function HomeStepsSection() {
  const t = await getTranslations("homeSteps");

  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1">
          <ul className="space-y-7">
            <StepCard n={1} title={t("step1_title")} desc={t("step1_desc")} />
            <StepCard n={2} title={t("step2_title")} desc={t("step2_desc")} />
            <StepCard n={3} title={t("step3_title")} desc={t("step3_desc")} />
          </ul>

          <div className="mt-10">
            <Link
              href="/#how"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              {t("cta")}
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {t("title")}
            </h2>
            <div
              className="mt-10 hidden h-40 w-full rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(13,148,136,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(2,132,199,0.18),transparent_55%)] sm:block"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}

