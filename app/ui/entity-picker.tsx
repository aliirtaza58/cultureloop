"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { requestJson } from "./api.ts";

interface Match { id: string; name: string; types: string[]; proof: string }
export function EntityPicker({ roomId, purpose, disabled, onChoose }: {
  roomId: string; purpose: "book" | "interest"; disabled: boolean; onChoose: (proof: string) => Promise<boolean>;
}) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("book");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMatches(null);
    try {
      const data = await requestJson<{ identities: Match[] }>(`/api/rooms/${roomId}/search?${new URLSearchParams({ query, category: purpose === "book" ? "book" : category })}`);
      setMatches(data.identities);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Search could not finish. Try again."); }
    finally { setLoading(false); }
  }
  async function choose(match: Match) {
    if (await onChoose(match.proof)) { setMatches(null); setQuery(""); }
  }
  const locked = disabled || loading;
  return <div className="entity-picker" aria-busy={loading}>
    <form onSubmit={search}>
      {purpose === "interest" && <><label htmlFor="interest-category">Type of favorite</label><select id="interest-category" value={category} onChange={e => setCategory(e.target.value)} disabled={locked}><option value="book">Book</option><option value="movie">Film</option><option value="artist">Music artist</option><option value="video_game">Video game</option></select></>}
      <label htmlFor={`${purpose}-query`}>{purpose === "book" ? "Find the book you own" : "Find a cultural favorite"}</label>
      <div className="search-row"><input id={`${purpose}-query`} value={query} onChange={e => setQuery(e.target.value)} required maxLength={200} placeholder={purpose === "book" ? "Title, and author if needed" : "Something you already enjoy"} disabled={locked}/><button className="button" disabled={locked}>{loading ? "Searching…" : "Search"}</button></div>
    </form>
    {error && <p className="error-message" role="alert">{error}</p>}
    {matches && <div className="search-results" aria-live="polite"><p className="caption">{matches.length ? "Check the exact match before choosing it." : "No matches returned. Try a fuller title or another favorite."}</p>
      {matches.map(match => <div className="search-result" key={match.id}><span>{match.name}</span><button className="button small" disabled={disabled} onClick={() => void choose(match)}>{purpose === "book" ? "Offer this book" : "Add favorite"}</button></div>)}
    </div>}
  </div>;
}
