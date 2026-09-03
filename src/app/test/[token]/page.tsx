"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface TestSession {
  shownVersionId: string;
  kind: "ui" | "backend";
  content: string;
  customQuestions: string[];
}

export default function PublicTestPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant");
  const [session, setSession] = useState<TestSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [customAnswers, setCustomAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startRef = useRef<number>(0);
  const interactionsRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);
  const completeMsRef = useRef<number | null>(null);

  useEffect(() => {
    const url = variant
      ? `/api/prototype-test/${token}?variant=${encodeURIComponent(variant)}`
      : `/api/prototype-test/${token}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? "This test link is invalid or no longer active.");
        }
        return r.json();
      })
      .then((data: TestSession) => {
        setSession(data);
        setCustomAnswers(data.customQuestions.map(() => ""));
        startRef.current = Date.now();
      })
      .catch((e: Error) => setError(e.message));
  }, [token, variant]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.source !== "cortex-prototype") return;
      interactionsRef.current = event.data.interactions ?? interactionsRef.current;
      if (event.data.type === "complete") {
        completedRef.current = true;
        completeMsRef.current = event.data.ms ?? Date.now() - startRef.current;
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function submit() {
    if (!session) return;
    setSubmitting(true);
    const timeToCompleteMs = completeMsRef.current ?? Date.now() - startRef.current;

    await fetch(`/api/prototype-test/${token}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shownVersionId: session.shownVersionId,
        rating,
        comment: comment || undefined,
        customAnswers: session.customQuestions.map((question, i) => ({
          question,
          answer: customAnswers[i] ?? "",
        })),
        timeToCompleteMs,
        interactionCount: interactionsRef.current,
        completed: completedRef.current,
      }),
    });

    setSubmitting(false);
    setSubmitted(true);
  }

  if (error) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", fontSize: 14 }}>
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", fontSize: 14, color: "#666" }}>
        Loading…
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", fontSize: 14 }}>
        Thanks for trying it out — your feedback has been recorded.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Try it out</h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        Interact with the demo below, then share your feedback.
      </p>
      {variant && (
        <div
          style={{
            display: "inline-block",
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 99,
            background: "#fff3cd",
            color: "#7a5c00",
            marginBottom: 16,
          }}
        >
          Preview mode — showing this specific variant, not a random assignment
        </div>
      )}

      {session.kind === "ui" ? (
        <iframe
          srcDoc={session.content}
          sandbox="allow-scripts"
          style={{ width: "100%", height: 500, border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
          title="Prototype"
        />
      ) : (
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.6,
            background: "#f7f7f7",
            padding: 12,
            borderRadius: 8,
            maxHeight: 500,
            overflowY: "auto",
          }}
        >
          {session.content}
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>How would you rate this?</p>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  border: rating === n ? "2px solid #333" : "1px solid #ccc",
                  background: rating === n ? "#333" : "#fff",
                  color: rating === n ? "#fff" : "#333",
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Any comments?</p>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>

        {session.customQuestions.map((q, i) => (
          <div key={i}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{q}</p>
            <input
              value={customAnswers[i] ?? ""}
              onChange={(e) =>
                setCustomAnswers((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))
              }
              style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 6, border: "1px solid #ccc" }}
            />
          </div>
        ))}

        <button
          onClick={submit}
          disabled={submitting || rating == null}
          style={{
            alignSelf: "flex-start",
            padding: "8px 20px",
            fontSize: 13,
            borderRadius: 6,
            border: "none",
            background: "#333",
            color: "#fff",
            cursor: submitting || rating == null ? "not-allowed" : "pointer",
            opacity: submitting || rating == null ? 0.6 : 1,
          }}
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </button>
      </div>
    </div>
  );
}
