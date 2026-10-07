"use client";
import Nav from "@/components/Nav";
import { useUser } from "@/lib/UserContext";

export default function Profile() {
  const { user } = useUser();
  return (
    <>
      <Nav />
      <main className="page">
        {user && (
          <>
            <div className="center" style={{ padding: "20px 0" }}>
              <div className="avatar" style={{ width: 90, height: 90, fontSize: 42, margin: "0 auto 10px" }}>{user.name[0]}</div>
              <h1>{user.name}</h1><div style={{ color: "var(--muted)" }}>🇪🇸 Learning Spanish</div>
            </div>
            <div className="cards">
              <div className="card"><b>🔥 {user.streak}</b><span>Day streak</span></div>
              <div className="card"><b>⚡ {user.xp}</b><span>Total XP</span></div>
              <div className="card"><b>❤️ {user.hearts}/5</b><span>Hearts</span></div>
              <div className="card"><b>🎯 {user.xp_today}/{user.daily_goal}</b><span>Today&apos;s goal (XP)</span></div>
            </div>
            <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 30 }}>Settings &amp; achievements: coming soon</p>
          </>
        )}
      </main>
    </>
  );
}
