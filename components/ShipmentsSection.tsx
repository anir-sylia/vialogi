import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listShipments, type ShipmentRow } from "@/lib/shipments";

type Props = {
  locale: string;
  searchQuery: string | undefined;
};

const HOME_LIMIT = 6;

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function ShipmentsSection({ locale, searchQuery }: Props) {
  const t = await getTranslations("shipments");
  const shipments = await listShipments(searchQuery, { limit: HOME_LIMIT });

  return (
    <section
      id="loads"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {t("heading")}
          </h2>
          <p className="mt-1 text-[var(--text-muted)]">{t("subheading")}</p>
        </div>
        {searchQuery?.trim() ? (
          <p className="text-sm font-medium text-[var(--brand)]">
            {t("filteredBy", { q: searchQuery.trim() })}
          </p>
        ) : null}
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-6 py-16 text-center">
          <p className="text-lg font-medium text-[var(--text-primary)]">
            {searchQuery?.trim() ? t("emptyFiltered") : t("empty")}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shipments.map((s: ShipmentRow) => (
            <li key={s.id}>
              <article className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      {t("cardRoute")}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {s.origin}
                      </span>
                      <span className="text-[var(--text-muted)]" aria-hidden>
                        →
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {s.destination}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-muted)]">
                    <span>
                      {t("weight")}:{" "}
                      <span className="font-medium text-[var(--text-primary)]">
                        {Number(s.weight_kg).toLocaleString(
                          locale === "ar" ? "ar-MA" : "fr-FR",
                        )}{" "}
                        kg
                      </span>
                    </span>
                    <span>
                      {t("price")}:{" "}
                      <span className="font-medium text-[var(--text-primary)]">
                        {Number(s.price).toLocaleString(
                          locale === "ar" ? "ar-MA" : "fr-FR",
                          {
                            style: "currency",
                            currency: "MAD",
                            maximumFractionDigits: 0,
                          },
                        )}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDate(s.created_at, locale)}
                  </p>
                </div>
                <div className="mt-4 shrink-0 border-t border-[var(--border)] pt-4">
                  <Link
                    href={`/chat/${s.id}`}
                    className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    {t("openChat")}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
