"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
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
      {pending ? t("signupSubmitting") : t("signupSubmit")}
    </button>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2";

type Props = {
  locale: string;
  action: (formData: FormData) => void;
};

export function SignupForm({ locale, action }: Props) {
  const t = useTranslations("auth");
  const [role, setRole] = useState<"client" | "transporteur">("client");

  function handleSubmit(formData: FormData) {
    const local = String(formData.get("phone_local") ?? "").replace(/\s/g, "");
    const full = "+212" + (local.startsWith("0") ? local.slice(1) : local);
    formData.set("phone", full);
    formData.delete("phone_local");
    action(formData);
  }

  return (
    <form action={handleSubmit} className="mt-8 space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="role" value={role} />

      <div>
        <span className="mb-3 block text-sm font-medium text-[var(--text-primary)]">
          {t("roleLabel")}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              role === "client"
                ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            }`}
          >
            {t("roleClient")}
          </button>
          <button
            type="button"
            onClick={() => setRole("transporteur")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
              role === "transporteur"
                ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            }`}
          >
            {t("roleTransporteur")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t("firstName")}
          </label>
          <input id="first_name" name="first_name" type="text" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="last_name" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t("lastName")}
          </label>
          <input id="last_name" name="last_name" type="text" required className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          {t("phone")}
        </label>
        <div className="flex" dir="ltr">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-[var(--border)] bg-[var(--surface-muted)] px-3.5 text-sm font-semibold text-[var(--text-muted)] select-none">
            +212
          </span>
          <input
            id="phone"
            name="phone_local"
            type="tel"
            required
            inputMode="numeric"
            pattern="[0-9]{9,10}"
            maxLength={10}
            placeholder="6XX XXX XXX"
            className={inputCls + " rounded-l-none"}
          />
        </div>
      </div>

      {role === "transporteur" ? (
        <div>
          <label htmlFor="transport_type" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t("transportType")}
          </label>
          <select id="transport_type" name="transport_type" required className={inputCls}>
            <option value="">{t("transportTypePlaceholder")}</option>
            <option value="camion">{t("transportCamion")}</option>
            <option value="camionnette">{t("transportCamionnette")}</option>
            <option value="remorque">{t("transportRemorque")}</option>
            <option value="frigorifique">{t("transportFrigorifique")}</option>
            <option value="autre">{t("transportAutre")}</option>
          </select>
        </div>
      ) : null}

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
        <input id="password" name="password" type="password" required minLength={6} className={inputCls} />
        <p className="mt-1 text-xs text-[var(--text-muted)]">{t("passwordHint")}</p>
      </div>

      <SubmitButton />
    </form>
  );
}
