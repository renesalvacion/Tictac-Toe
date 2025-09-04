"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Round = { winner: "player1" | "player2" | "draw" };
type Game = {
  _id: string;
  player1: string;
  player2: string;
  status: "active" | "stopped";
  rounds: Round[];
  createdAt?: string;
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const apiBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }, []);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/games`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load games");
        const data = await res.json();
        setGames(data);
      } catch (e: any) {
        setError(e?.message || "Error loading games");
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [apiBase]);

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tic Tac Toe</h1>
        <Link
          href="/new"
          className="px-5 py-2.5 rounded-md bg-foreground text-background shadow-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground cursor-pointer notebook-btn"
        >
          Start New Game
        </Link>
      </header>

      {loading && <p>Loading games...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ul className="space-y-3">
          {games.length === 0 && (
            <li className="text-sm text-gray-500">No games yet.</li>
          )}
          {games.map((g) => {
            const p1Wins = g.rounds.filter((r) => r.winner === "player1").length;
            const p2Wins = g.rounds.filter((r) => r.winner === "player2").length;
            const draws = g.rounds.filter((r) => r.winner === "draw").length;
            return (
              <li
                key={g._id}
                className="rounded-md p-3 flex items-center justify-between notebook-card"
              >
                <div>
                  <div className="font-medium" style={{fontWeight:"800"}}>
                    {g.player1} vs {g.player2}
                    <span className="ml-2 text-xs uppercase tracking-wide px-2 py-0.5 rounded border">
                      {g.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    W/L/D: {p1Wins}-{p2Wins}-{draws}
                  </div>
                </div>
                <Link
                  href={`/game/${g._id}`}
                  className="text-sm underline"
                >
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
