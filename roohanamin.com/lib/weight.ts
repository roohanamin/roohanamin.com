import { z } from "zod";
export type Unit = "lb" | "kg";
export type Entry = {
  id: string;
  weight_kg: number;
  unit: Unit;
  measured_on: string;
  note: string;
  created_at: string;
};
export type Result = { error?: string; message?: string };
export const entrySchema = z
  .object({
    id: z.string().uuid(),
    weight: z
      .string()
      .trim()
      .regex(
        /^\d+(\.\d{1,2})?$/,
        "Enter a weight with up to two decimal places.",
      )
      .transform(Number),
    unit: z.enum(["lb", "kg"]),
    measured_on: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => {
        const date = new Date(v + "T12:00:00Z");
        return (
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === v &&
          v >= "1900-01-01" &&
          v <= "2100-12-31"
        );
      }, "Choose a valid date."),
    note: z.string().trim().max(300, "Keep notes under 300 characters."),
  })
  .refine(
    (v) => {
      const kg = toKg(v.weight, v.unit);
      return kg >= 1 && kg <= 700;
    },
    {
      message: "Enter a weight between 1 and 700 kg (2.21–1543.23 lb).",
      path: ["weight"],
    },
  );
export function toKg(value: number, unit: Unit) {
  return Math.round((unit === "lb" ? value * 0.45359237 : value) * 1000) / 1000;
}
export function fromKg(value: number, unit: Unit) {
  return unit === "lb" ? value / 0.45359237 : value;
}
export function formatWeight(value: number, unit: Unit) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(fromKg(value, unit));
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}
export function newestFirst(entries: Entry[]) {
  return [...entries].sort(
    (a, b) =>
      b.measured_on.localeCompare(a.measured_on) ||
      b.created_at.localeCompare(a.created_at) ||
      b.id.localeCompare(a.id),
  );
}
