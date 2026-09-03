"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MeetingNoteForm } from "@/components/meeting-notes/MeetingNoteForm";
import { MeetingNoteCard } from "@/components/meeting-notes/MeetingNoteCard";
import type { MeetingNote } from "@/components/meeting-notes/types";
import { useGreenfieldFlow } from "@/components/flow/useGreenfieldFlow";
import { GreenfieldFlowBar } from "@/components/flow/GreenfieldFlowBar";
import { FlowStepFooter } from "@/components/flow/FlowStepFooter";

const PRODUCT_ID = "seed-product";

export default function MeetingNotesPage() {
  const searchParams = useSearchParams();
  const initiativeId = searchParams.get("initiativeId") ?? undefined;
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { flow, refresh: refreshFlow } = useGreenfieldFlow(initiativeId);

  useEffect(() => {
    const url = initiativeId
      ? `/api/meeting-notes?linkedInitiativeId=${initiativeId}`
      : "/api/meeting-notes";
    fetch(url)
      .then((r) => r.json())
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [initiativeId]);

  function handleCreated(note: MeetingNote) {
    setNotes((prev) => [note, ...prev]);
    refreshFlow();
  }

  function handleUpdated(note: MeetingNote) {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
    refreshFlow();
  }

  const suggested = notes.filter((n) => n.status === "suggested");
  const rest = notes.filter((n) => n.status !== "suggested");

  return (
    <div>
      {flow && <GreenfieldFlowBar flow={flow} />}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Meeting Notes</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
          Raw source material before it becomes an Insight or Requirement. Approve a
          note to feed it into the same JTBD extraction pipeline an interview uses.
        </p>
      </div>

      {flow &&
        initiativeId &&
        (() => {
          const step = flow.steps.find((s) => s.key === "meetingNotes")!;
          const nextStep = flow.steps[flow.steps.findIndex((s) => s.key === "meetingNotes") + 1];
          return (
            <FlowStepFooter
              initiativeId={initiativeId}
              stepKey="meetingNotes"
              mandatory={step.mandatory}
              done={step.status === "done"}
              skipped={step.status === "skipped"}
              nextHref={nextStep.href}
              nextLabel={nextStep.label}
              onSkipped={() => {
                window.location.href = nextStep.href;
              }}
            />
          );
        })()}

      <div style={{ marginBottom: 32 }}>
        <MeetingNoteForm productId={PRODUCT_ID} initiativeId={initiativeId} onCreated={handleCreated} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          Suggested Inbox {suggested.length > 0 && `(${suggested.length})`}
        </h2>
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
        ) : suggested.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Nothing suggested right now. Live Drive/Slack scanning isn&apos;t wired up
            yet — use the &quot;Add as Suggested&quot; toggle above to test this inbox.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {suggested.map((note) => (
              <MeetingNoteCard
                key={note.id}
                note={note}
                productId={PRODUCT_ID}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>All Notes</h2>
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
        ) : rest.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            No approved or rejected notes yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rest.map((note) => (
              <MeetingNoteCard
                key={note.id}
                note={note}
                productId={PRODUCT_ID}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
