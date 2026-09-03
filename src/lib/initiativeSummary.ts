import { computeRegimeSummary } from "@/lib/regimeSummary";

interface FeatureWithRegimes {
  requirements: { regime: string }[];
}

interface MeetingNoteNotetaker {
  geminiNotetakerEnabled: string | null;
}

interface InitiativeComputedInput {
  features: FeatureWithRegimes[];
  meetingNotes: MeetingNoteNotetaker[];
}

// Shared by the initiatives list route and the by-id route so the two screens
// that read notetakerFlag / regimeSummary can never disagree.
export function attachInitiativeComputedFields<T extends InitiativeComputedInput>(
  initiative: T
) {
  const { meetingNotes, features, ...rest } = initiative;

  const hasRegulated = features.some((f) =>
    f.requirements.some((r) => r.regime === "regulated")
  );
  const notetakerFlag =
    hasRegulated &&
    meetingNotes.some(
      (mn) => mn.geminiNotetakerEnabled === "no" || !mn.geminiNotetakerEnabled
    );

  return {
    ...rest,
    features: features.map(({ requirements, ...feature }) => ({
      ...feature,
      regimeSummary: computeRegimeSummary(requirements.map((r) => r.regime)),
    })),
    notetakerFlag,
  };
}
