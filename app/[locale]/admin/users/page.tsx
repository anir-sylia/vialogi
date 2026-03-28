import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getProfile, listClientAndTransporteurProfiles, type Profile } from "@/lib/auth";

type Props = {
  params: Promise<{ locale: string }>;
};

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ProfileTable({
  rows,
  locale,
  t,
}: {
  rows: Profile[];
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"adminUsers">>>;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 px-4 py-8 text-center text-sm text-[var(--text-muted)]">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)]/50 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3">{t("name")}</th>
            <th className="px-4 py-3">{t("role")}</th>
            <th className="px-4 py-3">{t("phone")}</th>
            <th className="px-4 py-3">{t("transportType")}</th>
            <th className="px-4 py-3">{t("points")}</th>
            <th className="px-4 py-3">{t("rating")}</th>
            <th className="px-4 py-3">{t("joined")}</th>
            <th className="px-4 py-3">{t("profile")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((p) => (
            <tr key={p.id} className="text-[var(--text-primary)]">
              <td className="px-4 py-3 font-medium">
                {p.first_name} {p.last_name}
              </td>
              <td className="px-4 py-3 capitalize">{p.role}</td>
              <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">{p.phone}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">
                {p.transport_type ?? "—"}
              </td>
              <td className="px-4 py-3 tabular-nums">{p.points}</td>
              <td className="px-4 py-3 tabular-nums">{p.avg_rating.toFixed(1)}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">
                {formatDate(p.created_at, locale)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/profile/${p.id}`}
                  className="font-medium text-[var(--brand)] hover:underline"
                >
                  {t("open")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: { pathname: "/login", query: { next: "/admin/users" } }, locale });
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "admin") {
    return redirect({ href: "/", locale });
  }

  const all = await listClientAndTransporteurProfiles();
  const clients = all.filter((p) => p.role === "client");
  const transporteurs = all.filter((p) => p.role === "transporteur");

  const t = await getTranslations("adminUsers");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← {t("backHome")}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">{t("subtitle")}</p>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          {t("clients")}{" "}
          <span className="text-sm font-normal text-[var(--text-muted)]">({clients.length})</span>
        </h2>
        <ProfileTable rows={clients} locale={locale} t={t} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          {t("transporteurs")}{" "}
          <span className="text-sm font-normal text-[var(--text-muted)]">
            ({transporteurs.length})
          </span>
        </h2>
        <ProfileTable rows={transporteurs} locale={locale} t={t} />
      </section>
    </div>
  );
}
