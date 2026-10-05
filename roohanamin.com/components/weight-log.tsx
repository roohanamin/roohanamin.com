"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "./brand";
import { InstallHelp, useOnline } from "./pwa";
import { saveEntry, deleteEntry } from "@/app/weight/actions";
import { signOut } from "@/app/login/actions";
import {
  entrySchema,
  formatDate,
  formatWeight,
  fromKg,
  localDate,
  newestFirst,
  toKg,
  type Entry,
  type Unit,
} from "@/lib/weight";

type Props = {
  entries: Entry[];
  count: number;
  page: number;
  email: string;
  loadError?: boolean;
  preview?: boolean;
};
export function WeightLog({
  entries: initialEntries,
  count,
  page,
  email,
  loadError = false,
  preview = false,
}: Props) {
  const router = useRouter();
  const online = useOnline();
  const [sampleEntries, setSampleEntries] = useState(initialEntries);
  const entries = preview ? sampleEntries : initialEntries;
  const total = preview ? entries.length : count;
  const [unit, setUnit] = useState<Unit>(entries[0]?.unit || "lb");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    error?: string;
    message?: string;
  }>({});
  const [pending, startTransition] = useTransition();
  const newId = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Resolve today's date on the device, never in the server's timezone.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- One client-only hydration update avoids a wrong calendar day on the server.
  useEffect(() => {
    setDate(localDate());
  }, []);
  const latest = entries[0];
  const previous = entries[1];
  const difference =
    latest && previous
      ? fromKg(latest.weight_kg - previous.weight_kg, unit)
      : null;

  function resetForm() {
    setEditing(null);
    setWeight("");
    setDate(localDate());
    setNote("");
    newId.current = null;
  }
  function edit(entry: Entry) {
    setEditing(entry.id);
    setUnit(entry.unit);
    setWeight(String(Number(fromKg(entry.weight_kg, entry.unit).toFixed(2))));
    setDate(entry.measured_on);
    setNote(entry.note);
    setFeedback({});
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online || pending) return;
    newId.current ||= crypto.randomUUID();
    const fields = new FormData(event.currentTarget);
    const data = {
      id: editing || newId.current,
      weight: String(fields.get("weight") || ""),
      unit,
      measured_on: String(fields.get("date") || ""),
      note: String(fields.get("note") || ""),
    };
    const parsed = entrySchema.safeParse(data);
    if (!parsed.success) {
      setFeedback({ error: parsed.error.issues[0].message });
      return;
    }
    setFeedback({});
    startTransition(async () => {
      try {
        if (preview) {
          const existing = entries.find((entry) => entry.id === data.id);
          setSampleEntries(
            newestFirst([
              ...entries.filter((entry) => entry.id !== data.id),
              {
                id: data.id,
                weight_kg: toKg(parsed.data.weight, unit),
                unit,
                measured_on: parsed.data.measured_on,
                note: parsed.data.note,
                created_at: existing?.created_at || new Date().toISOString(),
              },
            ]),
          );
          setFeedback({
            message: "Sample entry saved. Preview data resets on reload.",
          });
          resetForm();
          return;
        }
        const form = new FormData();
        Object.entries(data).forEach(([key, value]) => form.set(key, value));
        const result = await saveEntry(form);
        setFeedback(result);
        if (!result.error) {
          resetForm();
          router.refresh();
        }
      } catch {
        setFeedback({
          error:
            "Connection interrupted. Your entry is still here—try saving again.",
        });
      }
    });
  }
  function remove(id: string) {
    setFeedback({});
    startTransition(async () => {
      try {
        if (preview) {
          setSampleEntries(entries.filter((entry) => entry.id !== id));
          setConfirmDelete(null);
          if (editing === id) resetForm();
          setFeedback({ message: "Sample entry deleted." });
          return;
        }
        const result = await deleteEntry(id);
        setFeedback(result);
        if (!result.error) {
          setConfirmDelete(null);
          if (editing === id) resetForm();
          if (entries.length === 1 && page > 1)
            router.push("/weight?page=" + (page - 1));
          else router.refresh();
        }
      } catch {
        setFeedback({
          error:
            "Connection interrupted. The entry could not be confirmed as deleted. Refresh and try again.",
        });
      }
    });
  }
  return (
    <div className="site-shell">
      <header className="site-header">
        <Brand />
        <div className="account">
          <span title={email}>{preview ? "Sample account" : email}</span>
          {preview ? (
            <Link className="text-button" href="/login">
              Sign-in screen ↗
            </Link>
          ) : (
            <button
              className="text-button"
              disabled={pending || !online}
              onClick={() =>
                startTransition(async () => {
                  const result = await signOut();
                  if (result?.error) setFeedback(result);
                })
              }
            >
              Sign out ↗
            </button>
          )}
        </div>
      </header>
      <main id="main">
        {preview && (
          <div className="preview-banner">
            INTERACTIVE PREVIEW · Sample data only. Changes reset when you
            reload.
          </div>
        )}
        {!online && (
          <p role="status" className="notice">
            You’re offline. Reconnect to save changes. Anything typed here stays
            until you close or reload this page.
          </p>
        )}
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              <span className="dot" /> YOUR DAILY CHECK-IN
            </p>
            <h1>
              Your weight log<span className="heading-dot">.</span>
            </h1>
            <p>A moment for yourself. A little more perspective.</p>
          </div>
          <span className="private-badge">◎ Only you can see your log</span>
        </div>
        {loadError && (
          <div role="alert" className="error">
            Your log couldn’t load. Your saved entries have not been changed.{" "}
            <button className="text-button" onClick={() => router.refresh()}>
              Try again
            </button>
          </div>
        )}
        <section className="stats" aria-label="Weight summary">
          <div className="stat-card">
            <span>
              {page === 1 ? "LATEST CHECK-IN" : "FIRST CHECK-IN ON THIS PAGE"}
            </span>
            <div className="stat-value">
              {latest ? formatWeight(latest.weight_kg, unit) : "—"}{" "}
              <small>{unit}</small>
            </div>
            <p>
              {latest
                ? formatDate(latest.measured_on)
                : "Your first entry starts here"}
            </p>
          </div>
          <div className="stat-card">
            <span>CHANGE FROM PREVIOUS ENTRY</span>
            <div className="stat-value">
              {difference === null
                ? "—"
                : (difference > 0 ? "+" : "") + difference.toFixed(1)}{" "}
              <small>{unit}</small>
            </div>
            <p>
              {previous
                ? "One check-in at a time"
                : "Available after two entries"}
            </p>
          </div>
          <div className="stat-card count-stat">
            <span>CHECK-INS LOGGED</span>
            <div className="stat-value">{total.toLocaleString()}</div>
            <p>A growing picture, at your pace</p>
          </div>
        </section>
        <div className="workspace">
          <aside className="entry-column">
            <section className="card entry-card">
              <div className="section-title">
                <h2>{editing ? "Edit check-in" : "Log a check-in"}</h2>
                <span aria-hidden="true">↗</span>
              </div>
              <p className="section-description">
                {editing
                  ? "Make a correction to your entry."
                  : "A small habit. A useful record."}
              </p>
              <form onSubmit={submit}>
                <div className="field-heading">
                  <label htmlFor="weight">Weight</label>
                  <div
                    className="unit-switch"
                    role="group"
                    aria-label="Weight unit"
                  >
                    {(["lb", "kg"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={unit === value}
                        disabled={pending}
                        onClick={() => {
                          if (value === unit) return;
                          if (weight && Number.isFinite(Number(weight)))
                            setWeight(
                              String(
                                Number(
                                  (value === "kg"
                                    ? Number(weight) * 0.45359237
                                    : Number(weight) / 0.45359237
                                  ).toFixed(2),
                                ),
                              ),
                            );
                          setUnit(value);
                        }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="weight-input">
                  <input
                    ref={inputRef}
                    id="weight"
                    name="weight"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={unit === "lb" ? "165.0" : "75.0"}
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    required
                    disabled={pending}
                    maxLength={8}
                  />
                  <span>{unit}</span>
                </div>
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={date}
                  min="1900-01-01"
                  max="2100-12-31"
                  onChange={(event) => setDate(event.target.value)}
                  required
                  disabled={pending}
                />
                <label htmlFor="note">
                  A little note <span className="optional">optional</span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  placeholder="Anything you’d like to remember…"
                  rows={3}
                  maxLength={300}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  disabled={pending}
                />
                <button
                  className="primary"
                  disabled={pending || !online || !date}
                >
                  {pending
                    ? "Working…"
                    : editing
                      ? "Save changes"
                      : "Save check-in"}
                  <span aria-hidden="true">+</span>
                </button>
                {editing && (
                  <button
                    type="button"
                    className="cancel-edit"
                    disabled={pending}
                    onClick={resetForm}
                  >
                    Cancel editing
                  </button>
                )}
                {feedback.error && (
                  <p className="error" role="alert">
                    {feedback.error}
                  </p>
                )}
                {feedback.message && (
                  <p className="success" role="status">
                    {feedback.message}
                  </p>
                )}
              </form>
              <p className="save-note">Saved privately to your account.</p>
            </section>
            <InstallHelp />
            <p className="gentle-note">
              Every check-in is just a data point.
              <br />
              The bigger picture takes time.
            </p>
          </aside>
          <section
            className="card history-card"
            aria-labelledby="history-title"
          >
            <div className="history-header">
              <div>
                <h2 id="history-title">
                  Your history <span className="count-badge">{total}</span>
                </h2>
                <p>Most recent first</p>
              </div>
              <div className="unit-label">{unit.toUpperCase()}</div>
            </div>
            {entries.length === 0 ? (
              <div className="empty-state">
                <span aria-hidden="true">↗</span>
                <h3>
                  {loadError
                    ? "Your log is unavailable"
                    : "Here’s to your first check-in."}
                </h3>
                <p>
                  {loadError
                    ? "Try refreshing to load your entries."
                    : "Add a weight and a date. Your entries will appear here, newest first."}
                </p>
              </div>
            ) : (
              <>
                <div className="history-table-heading" aria-hidden="true">
                  <span>DATE</span>
                  <span>WEIGHT</span>
                  <span>NOTE</span>
                  <span />
                </div>
                <ol className="history-list">
                  {entries.map((entry, index) => (
                    <li className="history-row" key={entry.id}>
                      <div className="entry-date">
                        <time dateTime={entry.measured_on}>
                          {formatDate(entry.measured_on)}
                        </time>
                        {index === 0 && page === 1 && (
                          <small>Latest entry</small>
                        )}
                      </div>
                      <strong className="entry-weight">
                        {formatWeight(entry.weight_kg, unit)}
                        <small> {unit}</small>
                      </strong>
                      <p className="entry-note">
                        {entry.note || <span className="no-note">—</span>}
                      </p>
                      <div className="entry-actions">
                        <button
                          className="icon-button"
                          aria-label={
                            "Edit entry for " + formatDate(entry.measured_on)
                          }
                          disabled={pending}
                          onClick={() => edit(entry)}
                        >
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="icon-button"
                          aria-label={
                            "Delete entry for " + formatDate(entry.measured_on)
                          }
                          disabled={pending || !online}
                          onClick={() => setConfirmDelete(entry.id)}
                        >
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                      {confirmDelete === entry.id && (
                        <div
                          className="delete-confirm"
                          role="group"
                          aria-label="Confirm deletion"
                        >
                          <span>
                            Delete this check-in? This cannot be undone.
                          </span>
                          <button
                            className="danger-button"
                            disabled={pending || !online}
                            onClick={() => remove(entry.id)}
                          >
                            Delete
                          </button>
                          <button
                            className="text-button"
                            disabled={pending}
                            onClick={() => setConfirmDelete(null)}
                          >
                            Keep entry
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            )}
            <div className="history-footer">
              <span>
                {total
                  ? `${(page - 1) * 30 + 1}–${Math.min(page * 30, total)} of ${total} check-ins`
                  : "Your story starts with one entry."}
              </span>
              <span>↓ Newest first</span>
            </div>
            {(page > 1 || page * 30 < total) && !preview && (
              <nav className="pagination" aria-label="History pages">
                {page > 1 && (
                  <Link href={"/weight?page=" + (page - 1)}>
                    ← Newer entries
                  </Link>
                )}
                {page * 30 < total && (
                  <Link href={"/weight?page=" + (page + 1)}>
                    Older entries →
                  </Link>
                )}
              </nav>
            )}
          </section>
        </div>
      </main>
      <footer className="site-footer">
        <span>Less noise. More perspective.</span>
        <span>roohanamin.com</span>
      </footer>
    </div>
  );
}
