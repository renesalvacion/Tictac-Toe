"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = prefersDark ? "dark" : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed bottom-4 right-4 h-10 w-10 rounded-full border shadow-sm flex items-center justify-center bg-white/70 dark:bg-black/40 backdrop-blur-sm hover:opacity-90 transition cursor-pointer"
    >
      {theme === "dark" ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1ZM12 4a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm8 9a1 1 0 0 1-1-1 1 1 0 1 1 2 0 1 1 0 0 1-1 1ZM4 13a1 1 0 0 1-1-1 1 1 0 1 1 2 0 1 1 0 0 1-1 1Zm12.95 6.536a1 1 0 0 1 0-1.414l.707-.707a1 1 0 1 1 1.415 1.414l-.708.707a1 1 0 0 1-1.414 0Zm-10.607 0-.707-.707A1 1 0 0 1 6.05 16.95l.707.707a1 1 0 1 1-1.414 1.415ZM17.657 7.05a1 1 0 0 1 0-1.414l.708-.707A1 1 0 0 1 19.78 6.05l-.707.707a1 1 0 0 1-1.415 0ZM4.222 6.05a1 1 0 0 1 1.415 0l.707.707A1 1 0 0 1 4.93 8.172L4.222 7.465a1 1 0 0 1 0-1.415Z"/>
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"/>
        </svg>
      )}
    </button>
  );
}


