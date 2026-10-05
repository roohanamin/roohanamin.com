import { notFound } from "next/navigation";
import { WeightLog } from "@/components/weight-log";
import { toKg, type Entry } from "@/lib/weight";
// Local review only. Never exposed by a production deployment.
export default function PreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const values = [166.4, 166.8, 166.2, 167.1, 166.9, 167.5];
  const notes = [
    "Morning check-in",
    "",
    "After a good night’s sleep",
    "",
    "Back to my usual routine",
    "A place to start",
  ];
  const entries: Entry[] = values.map((weight, i) => ({
    id: "a0000000-0000-4000-8000-" + String(i + 1).padStart(12, "0"),
    weight_kg: toKg(weight, "lb"),
    unit: "lb",
    measured_on: "2026-10-" + String(5 - i > 0 ? 5 - i : 1).padStart(2, "0"),
    note: notes[i],
    created_at: new Date(Date.UTC(2026, 9, 5 - i, 8)).toISOString(),
  }));
  return (
    <WeightLog
      entries={entries}
      count={entries.length}
      page={1}
      email="Sample account"
      preview
    />
  );
}
