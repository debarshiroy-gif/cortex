import type { PrdStory } from "@/lib/prdStories";

export type { PrdStory };

export interface Prd {
  id: string;
  initiativeId: string | null;
  content: string | null;
  stories: string; // JSON PrdStory[]
  status: string;
  mergedIntoMaster: boolean;
  updatedAt: string;
}
