"use client";

import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const t = useTranslations("auth");
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--brand)] py-3.5 text-base font-semibold text-white shadow-md transition-opacity disabled:opacity-60"
    >
      {pending ? t("loginSubmitting") : t("loginSubmit")}
    </button>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2";

type Props = {
  locale: string;
  nextPath?: string;
  action: (formData: FormData) => void;
};

export function LoginForm({ locale, nextPath, action }: Props) {
  const t = useTranslations("auth");

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={nextPath ?? ""} />

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className={inputCls} />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          {t("password")}
        </label>
        <input id="password" name="password" type="password" required className={inputCls} />
      </div>

      <SubmitButton />
    </form>
  );
}
