"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteBufferOverlay({ minMs = 300 }: { minMs?: number }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setShow(true);
    const t = setTimeout(() => {
      if (!cancelled) setShow(false);
    }, minMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pathname, minMs]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-4 py-3 rounded-lg bg-white/80 dark:bg-neutral-900/80 shadow">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-xs text-gray-700 dark:text-gray-200">Loading…</span>
        </div>
      </div>
    </div>
  );
}

