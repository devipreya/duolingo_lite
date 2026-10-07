export type User = {
  name: string; xp: number; streak: number; active_today: boolean; hearts: number; gems: number;
  daily_goal: number; xp_today: number; seconds_to_next_heart: number | null;
};
export type Skill = { id: number; title: string; icon: string; state: "locked" | "available" | "completed"; is_current: boolean; lesson_id: number };
export type Unit = { id: number; order: number; title: string; color: string; skills: Skill[] };
export type Exercise = {
  id: number; type: "multiple_choice" | "translate_bank" | "match_pairs" | "fill_blank" | "type_answer";
  prompt: string; answer: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};
export type Lesson = { id: number; skill: string; exercises: Exercise[]; user: User };
export type Complete = { xp_earned: number; perfect: boolean; streak_extended: boolean; user: User };
export type Leader = { rank: number; name: string; xp: number; is_me: boolean };
