import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { InboxThreadRow } from "@/components/messages/InboxThreadRow";
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

  const threads = await listMessageInboxThreads(supabase, user.id);
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
            <InboxThreadRow key={thread.shipmentId} thread={thread} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}
