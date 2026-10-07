"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/UserContext";

const LINKS = [["/learn", "Learn"], ["/leaderboard", "Ranks"], ["/profile", "Profile"]];

export default function Nav() {
  const path = usePathname();
  const { user, offline, refresh } = useUser();
  return (
    <>
      <nav className="nav"><div className="nav-in">
        <Link href="/learn" className="logo">duolingo</Link>
        <div className="links">
          {LINKS.map(([href, label]) => <Link key={href} href={href} className={path.startsWith(href) ? "on" : ""}>{label}</Link>)}
        </div>
        {user && (
          <div className="stats">
            <span style={{ color: user.active_today ? "var(--orange)" : "var(--muted)" }}>🔥 {user.streak}</span>
            <span style={{ color: "var(--blue)" }}>💎 {user.gems}</span>
            <span style={{ color: "var(--red)" }}>❤️ {user.hearts}</span>
            <span style={{ color: "#e5a800" }}>⚡ {user.xp}</span>
          </div>
        )}
      </div></nav>
      {offline && (
        <div className="center"><div style={{ fontSize: 60 }}>🦉</div>
          <h2>Can&apos;t reach the server</h2><p>Start the backend on port 8000.</p>
          <button className="btn" onClick={refresh}>Try again</button></div>
      )}
    </>
  );
}
