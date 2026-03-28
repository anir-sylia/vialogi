"use client";

import { useEffect } from "react";

/** Scrolls to #loads when the home URL includes that hash (e.g. notification deep link). */
export function HomeHashScroll() {
  useEffect(() => {
    function scrollToLoads() {
      if (typeof window === "undefined") return;
      if (window.location.hash !== "#loads") return;
      requestAnimationFrame(() => {
        document.getElementById("loads")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }

    scrollToLoads();
    window.addEventListener("hashchange", scrollToLoads);
    return () => window.removeEventListener("hashchange", scrollToLoads);
  }, []);

  return null;
}
