"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type { Complete, Exercise, Lesson, User } from "@/lib/types";
import { BankEx, ChoiceEx, FillEx, MatchEx, TypeEx, type Result } from "./Exercises";

type Answer = string | string[] | null;
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
const PRAISE = ["Amazing!", "Great job!", "Nice one!", "Correct!"];

export default function LessonPlayer({ lessonId }: { lessonId: number }) {
  const router = useRouter();
  const { setUser, refresh } = useUser();
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(1);
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState<Answer>(null);
  const [result, setResult] = useState<Result>(null);
  const [hearts, setHearts] = useState(5);
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [noHearts, setNoHearts] = useState(false);
  const [done, setDone] = useState<Complete | null>(null);
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);

  useEffect(() => {
    get<Lesson>(`/api/lessons/${lessonId}`)
      .then((l) => { setQueue(l.exercises); setTotal(l.exercises.length); setHearts(l.user.hearts); setUser(l.user); if (l.user.hearts === 0) setNoHearts(true); })
      .catch(() => router.replace("/learn"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const ex = queue[pos];

  const check = useCallback(async (given: Answer, matchMistakes = 0) => {
    if (!ex || result) return;
    let right = true;
    if (ex.type === "match_pairs") right = matchMistakes === 0;
    else {
      const text = Array.isArray(given) ? given.join(" ") : given ?? "";
      right = ex.answer.some((a) => norm(a) === norm(text));
    }
    setResult({ right: ex.type === "match_pairs" ? true : right, answer: ex.answer[0] ?? "" });
    if (right) setCorrect((c) => c + 1);
    else {
      setMistakes((m) => m + 1);
      if (ex.type !== "match_pairs") setQueue((q) => [...q, ex]);  // wrong answers repeat at the end
      else setCorrect((c) => c + 1);
      const u = await post<User>(`/api/lessons/${lessonId}/wrong`);
      setUser(u); setHearts(u.hearts);
    }
  }, [ex, result, lessonId, setUser]);

  const next = useCallback(async () => {
    if (!result) return;
    if (hearts === 0) { setNoHearts(true); return; }
    setResult(null); setAnswer(null);
    if (pos + 1 >= queue.length) {
      const res = await post<Complete>(`/api/lessons/${lessonId}/complete`, { mistakes });
      setUser(res.user); setDone(res);
    } else setPos(pos + 1);
  }, [result, hearts, mistakes, pos, queue.length, lessonId, setUser]);

  const canCheck = !!ex && ex.type !== "match_pairs" && !!answer && (typeof answer !== "string" || answer.trim() !== "");

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || noHearts || done) return;
      if (result) next(); else if (canCheck) check(answer);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [noHearts, done, result, canCheck, answer, next, check]);

  const leave = async () => { await refresh(); router.push("/learn"); };
  const refill = async () => { const u = await post<User>("/api/hearts/refill"); setUser(u); setHearts(u.hearts); setNoHearts(false); };

  if (done) {
    return (
      <div className="done">
        <div style={{ fontSize: 110 }}>🦉</div>
        <h1>Lesson Complete!</h1>
        <div className="pill">⚡ +{done.xp_earned} XP</div>
        {done.perfect && <div style={{ color: "var(--green-d)", fontSize: 20 }}>💯 Perfect lesson!</div>}
        {done.streak_extended && <div style={{ color: "var(--orange)", fontSize: 20 }}>🔥 {done.user.streak} day streak!</div>}
        {done.user.xp_today >= done.user.daily_goal && <div style={{ fontSize: 18 }}>🎯 Daily goal reached</div>}
        <div className="fb"><div className="fb-in" style={{ justifyContent: "flex-end" }}>
          <button className="btn" onClick={leave}>Continue</button></div></div>
      </div>
    );
  }
  if (!ex) return <div className="center"><div style={{ fontSize: 70 }}>🦉</div></div>;

  const sel = typeof answer === "string" ? answer : null;
  return (
    <div className="lesson">
      <div className="l-top">
        <button className="close" aria-label="Quit" onClick={() => { if (confirm("Quit? You will lose your progress in this lesson.")) leave(); }}>✕</button>
        <div className="bar"><div style={{ width: `${Math.round((correct / total) * 100)}%` }} /></div>
        <b style={{ color: "var(--red)", fontSize: 18 }}>❤️ {hearts}</b>
      </div>

      <div className="l-body" key={`${pos}-${ex.id}`}>
        {ex.type === "multiple_choice" && <ChoiceEx ex={ex} selected={sel} onSelect={setAnswer} result={result} />}
        {ex.type === "fill_blank" && <FillEx ex={ex} selected={sel} onSelect={setAnswer} result={result} />}
        {ex.type === "translate_bank" && <BankEx ex={ex} onChange={setAnswer} locked={!!result} />}
        {ex.type === "type_answer" && <TypeEx ex={ex} value={sel ?? ""} onChange={setAnswer} locked={!!result} />}
        {ex.type === "match_pairs" && <MatchEx ex={ex} locked={!!result} onDone={(m) => check("ok", m)} />}
      </div>

      <div className={`fb ${result ? (result.right ? "right" : "wrong") : ""}`}>
        <div className="fb-in">
          {result ? (
            <div>
              <div className="fb-t">{result.right ? praise : "Correct solution:"}</div>
              {!result.right && <div className="fb-s">{result.answer}</div>}
            </div>
          ) : <span />}
          {result
            ? <button className="btn" onClick={next} autoFocus>Continue</button>
            : <button className="btn" disabled={!canCheck} onClick={() => check(answer)}>Check</button>}
        </div>
      </div>

      {noHearts && (
        <div className="overlay"><div className="modal">
          <div className="big">💔</div><h2>You ran out of hearts</h2>
          <p style={{ margin: 0 }}>Practice to get hearts back, or try again later (1 heart every 30 min).</p>
          <button className="btn block" onClick={refill}>Refill hearts (free practice)</button>
          <button className="btn white block" onClick={leave}>No thanks</button>
        </div></div>
      )}
    </div>
  );
}
