"use client";
import { useEffect, useRef, useState } from "react";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const seqTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("sound_enabled") : null;
    if (stored === "true") setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (seqTimerRef.current) {
        window.clearInterval(seqTimerRef.current);
        seqTimerRef.current = null;
      }
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      }
      localStorage.setItem("sound_enabled", "false");
      return;
    }
    // Start a simple chiptune-style melody (original, gamey vibe)
    const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const gain = gainRef.current ?? ctx.createGain();
    gainRef.current = gain;
    gain.connect(ctx.destination);
    gain.gain.value = 0.0;

    const osc = oscRef.current ?? ctx.createOscillator();
    oscRef.current = osc;
    osc.type = "square";
    if (osc.context.state !== "running") try { osc.start(); } catch {}
    osc.connect(gain);

    // frequency table
    const freqs: Record<string, number> = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0
    };

    // A playful loop inspired by classic platformers (not the original theme)
    const melody: (keyof typeof freqs | "rest")[] = [
      "E5","E5","rest","E5","rest","C5","E5","rest","G5","rest",
      "C5","G4","E4","A4","B4","A4","G4","E5","G5","A5","F5","G5","E5","C5","D5","B4"
    ];
    let step = 0;
    const bpm = 180; // snappy tempo
    const beatMs = (60_000 / bpm) * 0.75; // swing a bit

    const tick = () => {
      const n = melody[step % melody.length];
      const now = ctx.currentTime;

      if (n === "rest") {
        // quick dip
        gain.gain.setTargetAtTime(0.0, now, 0.02);
      } else {
        const target = freqs[n];
        // pitch + tiny slide
        osc.frequency.setTargetAtTime(target, now, 0.005);
        // plucky envelope
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, now + Math.min(beatMs / 1000, 0.25));
      }
      step++;
    };

    tick();
    seqTimerRef.current = window.setInterval(tick, beatMs);

    // fade in master
    gain.gain.setTargetAtTime(0.02, ctx.currentTime, 0.25);
    localStorage.setItem("sound_enabled", "true");

    return () => {
      // keep context/osc alive for smooth toggles; timers are cleared above on disable
    };
  }, [enabled]);

  const toggle = async () => {
    if (!enabled) {
      // resume context due to autoplay policies
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
    }
    setEnabled((e) => !e);
  };

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Mute" : "Play theme"}
      className="fixed bottom-4 right-16 h-10 w-10 rounded-full border shadow-sm flex items-center justify-center bg-white/70 dark:bg-black/40 backdrop-blur-sm hover:opacity-90 transition cursor-pointer"
    >
      {enabled ? (
        // Speaker on icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M4 9v6h4l5 4V5L8 9H4z"/>
          <path d="M16.5 12a4.5 4.5 0 0 0-2.1-3.8v7.6a4.5 4.5 0 0 0 2.1-3.8z"/>
        </svg>
      ) : (
        // Speaker muted icon (slash)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M4 9v6h4l5 4V5L8 9H4z"/>
          <path d="M21 4 3 22" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )}
    </button>
  );
}


