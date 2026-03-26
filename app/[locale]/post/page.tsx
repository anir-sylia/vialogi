import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { submitShipment } from "@/lib/actions/post-shipment";
import { SubmitShipmentButton } from "./submit-shipment-button";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ e?: string | string[] }>;
};

const errorCodes = [
  "required_fields",
  "invalid_weight",
  "invalid_price",
  "db",
  "env",
  "unknown_error",
] as const;

type ErrorCode = (typeof errorCodes)[number];

function parseError(raw: string | string[] | undefined): ErrorCode | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return errorCodes.includes(v as ErrorCode) ? (v as ErrorCode) : null;
}

export default async function PostPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const errCode = parseError(sp?.e);

  const t = await getTranslations("postPage");
  const tf = await getTranslations("postForm");
  const te = await getTranslations("postForm.errors");

  const errorMessage = errCode ? te(errCode) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        {t("back")}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-[var(--text-muted)]">
        {t("subtitle")}
      </p>

      <form action={submitShipment} className="mt-8 space-y-6">
        <input type="hidden" name="locale" value={locale} />

        {errorMessage ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="origin"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {tf("origin")}
            </label>
            <input
              id="origin"
              name="origin"
              type="text"
              required
              autoComplete="off"
              placeholder={tf("originPlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="destination"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {tf("destination")}
            </label>
            <input
              id="destination"
              name="destination"
              type="text"
              required
              autoComplete="off"
              placeholder={tf("destinationPlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="weight_kg"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {tf("weight")}
            </label>
            <input
              id="weight_kg"
              name="weight_kg"
              type="text"
              inputMode="decimal"
              required
              placeholder={tf("weightPlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              {tf("price")}
            </label>
            <input
              id="price"
              name="price"
              type="text"
              inputMode="decimal"
              required
              placeholder={tf("pricePlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2"
            />
          </div>
        </div>

        <SubmitShipmentButton
          label={tf("submit")}
          pendingLabel={tf("submitting")}
        />
      </form>
    </div>
  );
}
