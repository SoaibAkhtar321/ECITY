// fcityAIBus.ts
//
// Minimal, dependency-free pub/sub so any component (header CTA, hero link,
// suggested-question chip elsewhere on the site, etc.) can open the global
// FCITY AI widget without needing to be a parent/child of it or wired
// through Redux. The widget itself is mounted once in src/layouts/Wrapper.tsx.

type Listener = (prefillQuestion?: string) => void;

const listeners = new Set<Listener>();

export const openFcityAI = (prefillQuestion?: string): void => {
   listeners.forEach((listener) => listener(prefillQuestion));
};

export const onFcityAIOpen = (listener: Listener): (() => void) => {
   listeners.add(listener);
   return () => listeners.delete(listener);
};
