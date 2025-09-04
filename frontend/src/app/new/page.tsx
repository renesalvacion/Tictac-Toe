"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewGamePage() {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const apiBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    console.log("API BASE:", apiBase);

  }, []);
  console.log("API BASE:", apiBase);


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1.trim() || !player2.trim()) {
      setError("Both player names are required");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`${apiBase}/api/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player1: player1.trim(), player2: player2.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create game");
      const game = await res.json();
      router.replace(`/game/${game._id}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Start New Game</h1>
      <form onSubmit={onSubmit} className="space-y-4 notebook-card rounded-md p-4">
        <div>
          <label className="block text-sm mb-1">Player 1</label>
          <input
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
            placeholder="Enter Player 1 name"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Player 2</label>
          <input
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-transparent"
            placeholder="Enter Player 2 name"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          disabled={submitting}
          className="px-5 py-2.5 rounded-md bg-foreground text-background shadow-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer notebook-btn"
          type="submit"
        >
          {submitting ? "Starting..." : "Start"}
        </button>
      </form>
    </div>
  );
}


