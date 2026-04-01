import { format, parseISO } from "date-fns";
import { arSA, fr } from "date-fns/locale";

/** Segments for `postForm.dateRangeBetween` — null if dates missing or invalid. */
export function shipmentDateRangeParts(
  pickupYmd: string | null | undefined,
  deliverYmd: string | null | undefined,
  locale: string,
): { from: string; to: string } | null {
  if (!pickupYmd?.trim() || !deliverYmd?.trim()) return null;
  try {
    const dateLocale = locale === "ar" ? arSA : fr;
    return {
      from: format(parseISO(pickupYmd.trim()), "d MMM", { locale: dateLocale }),
      to: format(parseISO(deliverYmd.trim()), "d MMM yyyy", {
        locale: dateLocale,
      }),
    };
  } catch {
    return null;
  }
}
