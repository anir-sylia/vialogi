import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { listMessageInboxThreads } from "@/lib/chat-inbox";
import { getProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MessagesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({
      href: { pathname: "/login", query: { next: "/messages" } },
      locale,
    });
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    return redirect({
      href: { pathname: "/signup", query: { next: "/messages" } },
      locale,
    });
  }

  if (profile.role !== "client" && profile.role !== "transporteur") {
    return redirect({ href: "/", locale });
  }

  const threads = await listMessageInboxThreads(supabase);
  const t = await getTranslations("inbox");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("backHome")}
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{t("subtitle")}</p>

      {threads.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-[var(--border)] bg-white px-6 py-12 text-center text-sm text-[var(--text-muted)]">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {threads.map((thread) => (
            <li key={thread.shipmentId}>
              <Link
                href={`/chat/${thread.shipmentId}`}
                className="block rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-colors hover:border-[var(--brand)]/40 hover:bg-[var(--surface-muted)]"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {thread.origin} → {thread.destination}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                      {thread.lastMessagePreview}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-[var(--text-muted)] sm:ml-4"
                    dateTime={thread.lastMessageAt}
                  >
                    {new Date(thread.lastMessageAt).toLocaleString(locale, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                <span className="mt-3 inline-block text-sm font-medium text-[var(--brand)]">
                  {t("openChat")} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
