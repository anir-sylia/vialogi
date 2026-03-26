"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  pendingLabel: string;
};

export function SubmitShipmentButton({ label, pendingLabel }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--brand)] py-3.5 text-base font-semibold text-white shadow-md transition-opacity disabled:opacity-60 sm:w-auto sm:px-10"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
