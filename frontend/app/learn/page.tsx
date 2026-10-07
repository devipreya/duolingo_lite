"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { get } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type { Unit } from "@/lib/types";

const OFFSETS = [0, -50, -70, -50, 0, 50, 70, 50];

export default function Learn() {
  const [units, setUnits] = useState<Unit[] | null>(null);
  const { user, offline } = useUser();
  const router = useRouter();
  useEffect(() => { get<Unit[]>("/api/path").then(setUnits).catch(() => {}); }, [user?.xp]);

  let n = 0;
  const pct = user ? Math.min(100, Math.round((user.xp_today / user.daily_goal) * 100)) : 0;
  return (
    <>
      <Nav />
      {!offline && (
        <main className="page">
          {user && (
            <div className="goal">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <b style={{ color: "var(--strong)" }}>Daily goal</b>
                <span>{Math.min(user.xp_today, user.daily_goal)} / {user.daily_goal} XP {pct >= 100 && "🎯"}</span>
              </div>
              <div className="bar gold"><div style={{ width: `${pct}%` }} /></div>
            </div>
          )}
          {!units ? <div className="center"><div style={{ fontSize: 60 }}>🦉</div>Loading…</div> : units.map((unit) => (
            <section key={unit.id}>
              <div className="banner" style={{ background: unit.color }}>
                <small>Unit {unit.order}</small><h2>{unit.title}</h2>
              </div>
              <div className="path">
                {unit.skills.map((s) => {
                  const locked = s.state === "locked", done = s.state === "completed";
                  const face = locked ? "#e5e5e5" : done ? "#ffc800" : unit.color;
                  const edge = locked ? "#b7b7b7" : done ? "#e5a800" : "rgba(0,0,0,.25)";
                  return (
                    <div key={s.id} className="node-wrap" style={{ transform: `translateX(${OFFSETS[n++ % 8]}px)` }}>
                      {s.is_current && <div className="start">Start</div>}
                      <button className="node" disabled={locked} style={{ background: face, boxShadow: `0 6px 0 ${edge}` }}
                        onClick={() => router.push(`/lesson/${s.lesson_id}`)} aria-label={s.title}>
                        {locked ? "🔒" : done ? "✓" : s.icon}
                      </button>
                      <div className="node-title" style={{ color: locked ? "var(--muted)" : undefined }}>{s.title}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      )}
    </>
  );
}
