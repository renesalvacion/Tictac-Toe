"use client";
import { useMemo, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Cell = "" | "X" | "O";
type Round = { winner: "player1" | "player2" | "draw" };
type Game = {
  _id: string;
  player1: string;
  player2: string;
  status: "active" | "stopped";
  rounds: Round[];
};

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(""));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<null | "X" | "O" | "draw">(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds
  const [difficulty, setDifficulty] = useState<"easy"|"medium"|"hard"|null>(null);

  const getDurationForDifficulty = (d: typeof difficulty): number => {
    if (d === "easy") return 120;
    if (d === "medium") return 60;
    if (d === "hard") return 20;
    return 0;
  };

  const apiBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  }, []);

  useEffect(() => {
    const fetchGame = async () => {
      const res = await fetch(`${apiBase}/api/games/${params.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setGame(data);
      }
    };
    fetchGame();
  }, [apiBase, params.id]);

  // countdown timer effect
  useEffect(() => {
    if (winner || !game || game.status !== "active" || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft, winner, game]);

  // when timer reaches 0 without winner -> draw
  useEffect(() => {
    if (!winner && timeLeft === 0 && difficulty) {
      setWinner("draw");
    }
  }, [timeLeft, winner, difficulty]);

  const winLines: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  const [winLine, setWinLine] = useState<number[] | null>(null);

  const calculateWinner = (squares: Cell[]): "X" | "O" | null => {
    for (const [a, b, c] of winLines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        setWinLine([a, b, c]);
        return squares[a] as "X" | "O";
      }
    }
    setWinLine(null);
    return null;
  };

  const handleClick = (index: number) => {
    if (winner || board[index] || (game && game.status !== "active")) return;
    const next = board.slice();
    next[index] = xIsNext ? "X" : "O";
    const w = calculateWinner(next);
    setBoard(next);
    if (w) {
      setWinner(w);
      setTimeLeft(0);
    } else if (next.every((c) => c)) {
      setWinner("draw");
      setTimeLeft(0);
    } else {
      setXIsNext(!xIsNext);
      // reset timer on each valid move if a difficulty is active
      const resetTo = getDurationForDifficulty(difficulty);
      if (resetTo > 0) setTimeLeft(resetTo);
    }
  };

  const recordRound = async (choice: "continue" | "stop") => {
    if (!game) return;
    const roundWinner: "player1" | "player2" | "draw" =
      winner === "X" ? "player1" : winner === "O" ? "player2" : "draw";
    try {
      setSubmitting(true);
      await fetch(`${apiBase}/api/games/${game._id}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner: roundWinner, board: [board.slice(0,3), board.slice(3,6), board.slice(6,9)] }),
      });
      if (choice === "stop") {
        await fetch(`${apiBase}/api/games/${game._id}/stop`, { method: "POST" });
        router.replace("/");
        return;
      }
      // continue -> reset local board and pull latest game
      setBoard(Array(9).fill(""));
      setXIsNext(true);
      setWinner(null);
      setWinLine(null);
      setTimeLeft(0);
      setDifficulty(null);
      const res = await fetch(`${apiBase}/api/games/${game._id}`, { cache: "no-store" });
      if (res.ok) setGame(await res.json());
    } finally {
      setSubmitting(false);
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
          Loading...
        </div>
      </div>
    );
  }

  const p1Wins = game.rounds.filter((r) => r.winner === "player1").length;
  const p2Wins = game.rounds.filter((r) => r.winner === "player2").length;
  const draws = game.rounds.filter((r) => r.winner === "draw").length;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 ttt-board-bg bg-paper-anim">
      <div className="w-full max-w-md rounded-xl p-6 notebook-card ttt-ink">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">
            {game.player1} (X) vs {game.player2} (O)
          </h1>
          <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded border">{game.status}</span>
        </div>

        {/* Difficulty + Timer */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setDifficulty("easy"); setTimeLeft(120); }}
              disabled={!!winner || (game.status !== "active")}
              className="px-3 py-1.5 rounded-md border text-xs cursor-pointer disabled:opacity-60"
            >
              Easy (2m)
            </button>
            <button
              onClick={() => { setDifficulty("medium"); setTimeLeft(60); }}
              disabled={!!winner || (game.status !== "active")}
              className="px-3 py-1.5 rounded-md border text-xs cursor-pointer disabled:opacity-60"
            >
              Medium (1m)
            </button>
            <button
              onClick={() => { setDifficulty("hard"); setTimeLeft(20); }}
              disabled={!!winner || (game.status !== "active")}
              className="px-3 py-1.5 rounded-md border text-xs cursor-pointer disabled:opacity-60"
            >
              Hard (20s)
            </button>
          </div>
          <div className="text-sm tabular-nums">
            {timeLeft > 0 ? `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}` : "--:--"}
          </div>
        </div>

        <div className="mb-3 text-sm">Round W/L/D: {p1Wins}-{p2Wins}-{draws}</div>

        <div className="relative mx-auto grid grid-cols-3 gap-2 w-64 cursor-pencil">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              className="h-20 w-20 border rounded-md text-3xl font-semibold cursor-pencil ttt-cell"
            >
              {cell === "X" && (
                <svg viewBox="0 0 100 100" className="h-16 w-16">
                  <path d="M10 10 L90 90 M90 10 L10 90" stroke="currentColor" strokeWidth="10" strokeLinecap="round"/>
                </svg>
              )}
              {cell === "O" && (
                <svg viewBox="0 0 100 100" className="h-16 w-16">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="10"/>
                </svg>
              )}
            </button>
          ))}
          {winLine && (
            <svg className="pointer-events-none absolute inset-0" viewBox="0 0 100 100">
              {(() => {
                const mapPos = (i: number) => {
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  const x = 16 + col * 34;
                  const y = 16 + row * 34;
                  return { x, y };
                };
                const a = mapPos(winLine[0]);
                const c = mapPos(winLine[2]);
                return (
                  <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#0b2a6b" strokeWidth="8" strokeLinecap="round" />
                );
              })()}
            </svg>
          )}
        </div>

        <div className="mt-4 h-6">
          {!winner && <span className="text-sm">Turn: {xIsNext ? `${game.player1} (X)` : `${game.player2} (O)`}</span>}
          {winner === "X" && <span className="text-sm font-medium">Winner: {game.player1}</span>}
          {winner === "O" && <span className="text-sm font-medium">Winner: {game.player2}</span>}
          {winner === "draw" && <span className="text-sm font-medium">Draw</span>}
        </div>

        {winner && (
          <div className="mt-4 flex gap-3">
            <button
              disabled={submitting}
              onClick={() => recordRound("continue")}
              className="px-4 py-2 rounded-md border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue
            </button>
            <button
              disabled={submitting}
              onClick={() => recordRound("stop")}
              className="px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


