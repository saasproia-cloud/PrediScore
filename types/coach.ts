export type CoachRole = "user" | "coach";

export interface CoachMessage {
  id: string;
  role: CoachRole;
  content: string;
  createdAt: string; // ISO
}
