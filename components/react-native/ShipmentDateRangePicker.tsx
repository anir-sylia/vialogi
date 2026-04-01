/**
 * Shipment date range picker (React Native).
 *
 * Peer deps (install in your RN/Expo app):
 *   npx expo install @react-native-community/datetimepicker date-fns
 *   # or: yarn add @react-native-community/datetimepicker date-fns
 *
 * Optional: nativewind for `className` — here we use StyleSheet for zero config.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  addDays,
  format,
  isAfter,
  startOfDay,
} from "date-fns";
import { enUS } from "date-fns/locale";

// --- Types for backend payloads -------------------------------------------------

export type ShipmentDateRangeISO = {
  /** Earliest pickup (start of local calendar day, ISO 8601) */
  pickupAvailableFrom: string;
  /** Delivery deadline (end of local day optional — here: same instant as selected calendar day start; adjust if you need endOfDay) */
  deliverBy: string;
};

export type ShipmentDateRangePickerProps = {
  /** Initial min date (default: today local) */
  initialMinDate?: Date;
  /** Initial max date (default: today + 7d) */
  initialMaxDate?: Date;
  /** Called whenever range changes */
  onRangeChange?: (range: ShipmentDateRangeISO) => void;
  /** Optional label overrides */
  labels?: { from: string; to: string; summaryPrefix: string };
  containerStyle?: ViewStyle;
};

function normalizeToRange(
  min: Date,
  max: Date,
): { min: Date; max: Date } {
  const today = startOfDay(new Date());
  let nextMin = startOfDay(min);
  if (isAfter(today, nextMin)) nextMin = today;

  let nextMax = startOfDay(max);
  if (isAfter(nextMin, nextMax)) nextMax = nextMin;
  return { min: nextMin, max: nextMax };
}

function toBackendPayload(min: Date, max: Date): ShipmentDateRangeISO {
  return {
    pickupAvailableFrom: min.toISOString(),
    deliverBy: max.toISOString(),
  };
}

/** Friendly one-line summary, e.g. "Between 02 Apr and 09 Apr" */
function formatRangeLabel(min: Date, max: Date, locale = enUS): string {
  const sameYear = min.getFullYear() === max.getFullYear();
  const from = format(min, "dd MMM", { locale });
  const to = format(max, sameYear ? "dd MMM" : "dd MMM yyyy", { locale });
  return `Between ${from} and ${to}`;
}

export function ShipmentDateRangePicker({
  initialMinDate,
  initialMaxDate,
  onRangeChange,
  labels = {
    from: "De (prise en charge)",
    to: "À (livraison au plus tard)",
    summaryPrefix: "",
  },
  containerStyle,
}: ShipmentDateRangePickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [minDate, setMinDate] = useState<Date>(() =>
    normalizeToRange(
      initialMinDate ?? today,
      initialMaxDate ?? addDays(today, 7),
    ).min,
  );
  const [maxDate, setMaxDate] = useState<Date>(() =>
    normalizeToRange(
      initialMinDate ?? today,
      initialMaxDate ?? addDays(today, 7),
    ).max,
  );

  const [showMin, setShowMin] = useState(false);
  const [showMax, setShowMax] = useState(false);

  const emit = useCallback(
    (nextMin: Date, nextMax: Date) => {
      const { min, max } = normalizeToRange(nextMin, nextMax);
      setMinDate(min);
      setMaxDate(max);
      onRangeChange?.(toBackendPayload(min, max));
    },
    [onRangeChange],
  );

  const onMinChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === "android") setShowMin(false);
      if (!date) return;
      const next = startOfDay(date);
      const floor = today;
      const clampedMin = isAfter(floor, next) ? floor : next;
      let nextMax = maxDate;
      if (isAfter(clampedMin, maxDate)) nextMax = clampedMin;
      emit(clampedMin, nextMax);
    },
    [emit, maxDate, today],
  );

  const onMaxChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === "android") setShowMax(false);
      if (!date) return;
      const next = startOfDay(date);
      const clampedMax = isAfter(minDate, next) ? minDate : next;
      emit(minDate, clampedMax);
    },
    [emit, minDate],
  );

  const summary = useMemo(
    () => `${labels.summaryPrefix}${formatRangeLabel(minDate, maxDate)}`.trim(),
    [labels.summaryPrefix, minDate, maxDate],
  );

  const backendPreview = useMemo(
    () => toBackendPayload(minDate, maxDate),
    [minDate, maxDate],
  );

  return (
    <View style={[styles.card, containerStyle]}>
      <Text style={styles.summary}>{summary}</Text>

      <Pressable
        style={styles.row}
        onPress={() => {
          setShowMax(false);
          setShowMin(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Choose earliest pickup date"
      >
        <Text style={styles.label}>{labels.from}</Text>
        <Text style={styles.value}>{format(minDate, "EEEE d MMM yyyy")}</Text>
      </Pressable>

      {showMin && (
        <DateTimePicker
          value={minDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={today}
          onChange={onMinChange}
          {...(Platform.OS === "ios" ? { theme: "light" as const } : {})}
        />
      )}

      {Platform.OS === "ios" && showMin && (
        <Pressable style={styles.doneIos} onPress={() => setShowMin(false)}>
          <Text style={styles.doneIosText}>OK</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.row}
        onPress={() => {
          setShowMin(false);
          setShowMax(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Choose delivery deadline"
      >
        <Text style={styles.label}>{labels.to}</Text>
        <Text style={styles.value}>{format(maxDate, "EEEE d MMM yyyy")}</Text>
      </Pressable>

      {showMax && (
        <DateTimePicker
          value={maxDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minDate}
          onChange={onMaxChange}
        />
      )}

      {Platform.OS === "ios" && showMax && (
        <Pressable style={styles.doneIos} onPress={() => setShowMax(false)}>
          <Text style={styles.doneIosText}>OK</Text>
        </Pressable>
      )}

      {typeof __DEV__ !== "undefined" && __DEV__ ? (
        <Text style={styles.debug} selectable>
          {JSON.stringify(backendPreview, null, 2)}
        </Text>
      ) : null}
    </View>
  );
}

/** Use this shape when posting to your API (e.g. fetch body). */
export function getShipmentRangeISO(minDate: Date, maxDate: Date): ShipmentDateRangeISO {
  const { min, max } = normalizeToRange(minDate, maxDate);
  return toBackendPayload(min, max);
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  summary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  doneIos: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneIosText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 16,
  },
  debug: {
    marginTop: 8,
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
