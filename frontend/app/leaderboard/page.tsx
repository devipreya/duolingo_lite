"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { get } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type { Leader } from "@/lib/types";

export default function Leaderboard() {
  const [rows, setRows] = useState<Leader[]>([]);
  const { user } = useUser();
  useEffect(() => { get<Leader[]>("/api/leaderboard").then(setRows).catch(() => {}); }, [user?.xp]);
  return (
    <>
      <Nav />
      <main className="page">
        <div className="center" style={{ padding: "20px 0" }}><div style={{ fontSize: 56 }}>🏆</div><h1>Leaderboard</h1></div>
        {rows.map((r) => (
          <div key={r.rank} className={`row ${r.is_me ? "me" : ""}`}>
            <span style={{ width: 26, color: "var(--green-d)" }}>{r.rank}</span>
            <span className="avatar">{r.name[0]}</span>
            <span style={{ flex: 1, color: "var(--strong)" }}>{r.is_me ? `${r.name} (you)` : r.name}</span>
            <span style={{ color: "var(--muted)" }}>{r.xp} XP</span>
          </div>
        ))}
      </main>
    </>
  );
}
