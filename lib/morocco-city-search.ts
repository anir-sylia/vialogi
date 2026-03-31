/**
 * Normalisation des recherches de villes marocaines (Photon/URL ↔ colonnes `origin`/`destination`).
 * Les annonces stockent souvent le nom en latin (« Rabat ») alors que l’utilisateur arabe cherche « الرباط ».
 */

/** Première partie d’un libellé type Photon (« Ville, Région, Pays »). */
export function primaryLocalityForSearch(place: string): string {
  const t = place.trim();
  if (!t) return "";
  const i = t.indexOf(",");
  if (i === -1) return t;
  return t.slice(0, i).trim();
}

/**
 * Noms d’usage en arabe (admin / OSM) → forme latine usuelle pour ILIKE / Photon.
 * Compléter au besoin selon les libellés réels dans vos annonces.
 */
const MOROCCO_CITY_AR_TO_LATIN: Record<string, string> = {
  الرباط: "Rabat",
  "الدار البيضاء": "Casablanca",
  مراكش: "Marrakech",
  فاس: "Fès",
  الفاس: "Fès",
  طنجة: "Tanger",
  أكادير: "Agadir",
  مكناس: "Meknès",
  وجدة: "Oujda",
  القنيطرة: "Kénitra",
  تطوان: "Tétouan",
  سلا: "Salé",
  المحمدية: "Mohammedia",
  آسفي: "Safi",
  خريبكة: "Khouribga",
  "بني ملال": "Beni Mellal",
  الجديدة: "El Jadida",
  الناظور: "Nador",
  العيون: "Laâyoune",
  الداخلة: "Dakhla",
  تمارة: "Temara",
  سطات: "Settat",
  برشيد: "Berrechid",
  العرائش: "Larache",
  "القصر الكبير": "Ksar El Kebir",
  شفشاون: "Chefchaouen",
  الحسيمة: "Al Hoceima",
  ورزازات: "Ouarzazate",
  ازرو: "Ifrane",
  ميدالت: "Midelt",
  الرشيدية: "Errachidia",
  كلميم: "Guelmim",
  تازة: "Taza",
  تاوريرت: "Taourirt",
  "سيدي قاسم": "Sidi Kacem",
  الصويرة: "Essaouira",
  تارودانت: "Taroudant",
  زاكورة: "Zagora",
  مارتيل: "Martil",
  المضيق: "M'diq",
  بنسليمان: "Ben Slimane",
  "بن سليمان": "Ben Slimane",
  الخميسات: "Khemisset",
  وادزم: "Oued Zem",
  "الفقيه بنصالح": "Fquih Ben Salah",
  "قلعة السراغنة": "Kalaa des Sraghna",
  "سيدي بنور": "Sidi Bennour",
  اليوسفية: "Youssoufia",
  "سيدي إفني": "Sidi Ifni",
  طانطان: "Tan-Tan",
  بوعرفة: "Bouarfa",
  جرسيف: "Guercif",
  الفنيدق: "Fnideq",
};

/** Alias latin connu pour une requête en arabe (autocomplete / Photon). */
export function latinAliasForArabicMoroccoCity(name: string): string | null {
  const collapsed = name.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  const direct =
    MOROCCO_CITY_AR_TO_LATIN[collapsed] ??
    MOROCCO_CITY_AR_TO_LATIN[collapsed.normalize("NFC")];
  return direct ?? null;
}

/**
 * Terme unique pour filtrer `origin` / `destination` (page d’accueil, recherche transporteur).
 */
export function normalizeMoroccoCitySearchTerm(raw: string): string {
  const t = raw.replace(/"/g, "").trim();
  const primary = primaryLocalityForSearch(t);
  const collapsed = primary.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  return latinAliasForArabicMoroccoCity(collapsed) ?? collapsed;
}
