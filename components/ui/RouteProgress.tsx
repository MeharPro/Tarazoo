"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const finishRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // start progress on route change
    start();
    return () => {
      stopTimers();
      setActive(false);
      setProgress(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function stopTimers() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (finishRef.current) clearTimeout(finishRef.current);
    intervalRef.current = null;
    finishRef.current = null;
  }

  function start() {
    stopTimers();
    setActive(true);
    setProgress(10);
    // creep towards 85%
    intervalRef.current = setInterval(() => {
      setProgress((p) => (p < 85 ? Math.min(85, p + Math.random() * 10) : p));
    }, 120);
    // finish after a short delay
    finishRef.current = setTimeout(() => {
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 200);
    }, 900);
  }

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="h-[3px] bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 shadow"
        style={{ width: `${progress}%`, transition: "width 150ms ease" }}
      />
    </div>
  );
}

