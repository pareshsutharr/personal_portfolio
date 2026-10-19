"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { BrandMark } from "./brand-mark";

type Phase = "splash" | "travel" | "done";

const SplashContext = React.createContext<Phase>("done");
export const useSplashPhase = () => React.useContext(SplashContext);

const SESSION_KEY = "ps-splash-shown";
const ASSEMBLE_MS = 3000;
const TRAVEL_S = 0.9;
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * First-visit intro. A black overlay shows the logo assembling in the centre,
 * then the mark glides and shrinks into the exact spot of the nav logo
 * (measured live, so it lands correctly on every screen size) while the site
 * reveals underneath. Shown once per browser session.
 *
 * Server and client both start in the "splash" phase, so hydration matches;
 * returning visitors skip straight to "done" on mount.
 */
export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = React.useState<Phase>("splash");
  const [travel, setTravel] = React.useState<{ x: number; y: number; scale: number } | null>(null);
  const markRef = React.useRef<HTMLDivElement>(null);

  const finish = React.useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private mode or storage blocked: the splash simply shows again next load.
    }
    document.body.style.overflow = "";
    setPhase("done");
  }, []);

  React.useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      shown = false;
    }
    if (shown) {
      // Returning visitor: skip the intro on the next tick (keeps the effect body free of sync setState).
      const skip = window.setTimeout(() => setPhase("done"), 0);
      return () => window.clearTimeout(skip);
    }
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      const anchor = document.querySelector<HTMLElement>("[data-brand-anchor]");
      const mark = markRef.current;
      if (anchor && mark) {
        const a = anchor.getBoundingClientRect();
        const m = mark.getBoundingClientRect();
        setTravel({ x: a.left - m.left, y: a.top - m.top, scale: a.width / m.width });
      }
      setPhase("travel");
    }, ASSEMBLE_MS);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <SplashContext.Provider value={phase}>
      {children}
      <AnimatePresence>
        {phase !== "done" ? (
          <motion.div
            key="splash"
            aria-hidden
            onClick={finish}
            initial={false}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              ref={markRef}
              style={{ transformOrigin: "top left" }}
              animate={
                phase === "travel" && travel
                  ? { x: travel.x, y: travel.y, scale: travel.scale }
                  : { x: 0, y: 0, scale: 1 }
              }
              transition={{ duration: TRAVEL_S, ease: EASE }}
              onAnimationComplete={() => {
                if (phase === "travel") finish();
              }}
              className="h-24 w-24 sm:h-32 sm:w-32"
            >
              <BrandMark className="h-full w-full" replayOnHover={false} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SplashContext.Provider>
  );
}

/**
 * Wraps the page content. Hidden while the splash plays, then remounted so the
 * page's own entrance animations run after the logo has landed.
 */
export function SplashContent({ children }: { children: React.ReactNode }) {
  const phase = useSplashPhase();
  const done = phase === "done";
  return (
    <div key={done ? "site" : "pre"} className={done ? undefined : "invisible"}>
      {children}
    </div>
  );
}
