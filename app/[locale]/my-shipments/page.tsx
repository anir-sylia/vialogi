import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { ShipmentsSection } from "@/components/ShipmentsSection";
import { getProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MyShipmentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({
      href: { pathname: "/login", query: { next: "/my-shipments" } },
      locale,
    });
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    return redirect({
      href: { pathname: "/signup", query: { next: "/my-shipments" } },
      locale,
    });
  }

  if (profile.role !== "client") {
    return redirect({ href: "/", locale });
  }

  const tInbox = await getTranslations("inbox");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {tInbox("backHome")}
      </Link>
      <ShipmentsSection locale={locale} mode="mine" />
    </div>
  );
}
