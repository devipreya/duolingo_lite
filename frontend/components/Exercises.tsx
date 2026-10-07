"use client";
import { useEffect, useState } from "react";
import type { Exercise } from "@/lib/types";

export type Result = { right: boolean; answer: string } | null;

function Choices({ choices, selected, onSelect, result }: {
  choices: string[]; selected: string | null; onSelect: (v: string) => void; result: Result;
}) {
  return (
    <div className="choices">
      {choices.map((c) => {
        let cls = "choice";
        if (result) { if (result.answer === c) cls += " right"; else if (selected === c) cls += " wrong"; }
        else if (selected === c) cls += " sel";
        return <button key={c} className={cls} disabled={!!result} onClick={() => onSelect(c)}>{c}</button>;
      })}
    </div>
  );
}

export function ChoiceEx({ ex, selected, onSelect, result }: {
  ex: Exercise; selected: string | null; onSelect: (v: string) => void; result: Result;
}) {
  return <><h1>{ex.prompt}</h1><Choices choices={ex.data.choices} selected={selected} onSelect={onSelect} result={result} /></>;
}

export function FillEx({ ex, selected, onSelect, result }: {
  ex: Exercise; selected: string | null; onSelect: (v: string) => void; result: Result;
}) {
  const [before, after] = String(ex.data.sentence).split("_____");
  return (
    <>
      <h1>{ex.prompt}</h1>
      <div className="blank">{before}<u>{selected ?? "\u00A0"}</u>{after}
        <div style={{ fontSize: 15, color: "var(--muted)" }}>{ex.data.translation}</div></div>
      <Choices choices={ex.data.choices} selected={selected} onSelect={onSelect} result={result} />
    </>
  );
}

export function BankEx({ ex, onChange, locked }: { ex: Exercise; onChange: (w: string[] | null) => void; locked: boolean }) {
  const words: string[] = ex.data.words;
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => { onChange(picked.length ? picked.map((i) => words[i]) : null); /* eslint-disable-next-line */ }, [picked]);
  const toggle = (i: number) => { if (!locked) setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])); };
  return (
    <>
      <h1>{ex.prompt}</h1>
      <div className="speech">{ex.data.source}</div>
      <div className="line">{picked.map((i) => <button key={i} className="word" onClick={() => toggle(i)}>{words[i]}</button>)}</div>
      <div className="bank">
        {words.map((w, i) => <button key={i} className={`word ${picked.includes(i) ? "used" : ""}`} onClick={() => toggle(i)}>{w}</button>)}
      </div>
    </>
  );
}

export function TypeEx({ ex, value, onChange, locked }: { ex: Exercise; value: string; onChange: (v: string) => void; locked: boolean }) {
  return (
    <>
      <h1>{ex.prompt}</h1>
      <textarea rows={3} autoFocus value={value} disabled={locked} placeholder={ex.data.hint}
        autoCapitalize="off" autoCorrect="off" spellCheck={false}
        onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} />
    </>
  );
}

export function MatchEx({ ex, onDone, locked }: { ex: Exercise; onDone: (mistakes: number) => void; locked: boolean }) {
  const { left, right, pairs } = ex.data as { left: string[]; right: string[]; pairs: string[][] };
  const [sel, setSel] = useState<{ side: "l" | "r"; v: string } | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [shake, setShake] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  const click = (side: "l" | "r", v: string) => {
    if (locked) return;
    if (!sel || sel.side === side) { setSel({ side, v }); return; }
    const l = side === "l" ? v : sel.v, r = side === "r" ? v : sel.v;
    if (pairs.some((p) => p[0] === l && p[1] === r)) {
      const next = [...matched, l];
      setMatched(next); setSel(null);
      if (next.length === pairs.length) setTimeout(() => onDone(mistakes), 300);
    } else {
      setMistakes((m) => m + 1); setShake([`l:${l}`, `r:${r}`]); setSel(null);
      setTimeout(() => setShake([]), 450);
    }
  };
  const isDone = (side: "l" | "r", v: string) =>
    side === "l" ? matched.includes(v) : pairs.some((p) => p[1] === v && matched.includes(p[0]));
  const col = (side: "l" | "r", items: string[]) => (
    <div>
      {items.map((v) => {
        let cls = "choice";
        if (isDone(side, v)) cls += " done";
        else if (shake.includes(`${side}:${v}`)) cls += " shake";
        else if (sel && sel.side === side && sel.v === v) cls += " sel";
        return <button key={v} className={cls} onClick={() => click(side, v)}>{v}</button>;
      })}
    </div>
  );
  return <><h1>{ex.prompt}</h1><div className="match">{col("l", left)}{col("r", right)}</div></>;
}
