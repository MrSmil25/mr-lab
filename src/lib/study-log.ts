import { useEffect, useState } from "react";

export type StudySession = {
  id: string;
  method: string;
  seconds: number;
  at: number;
};

const STORAGE_KEY = "study-sessions";
const CHANGE_EVENT = "study-sessions-changed";

function load(): StudySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StudySession[]) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.seconds === "number") : [];
  } catch {
    return [];
  }
}

function save(items: StudySession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function logStudySession(method: string, seconds: number) {
  const safeSeconds = Math.floor(seconds);
  if (safeSeconds < 1) return;
  save([
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      method,
      seconds: safeSeconds,
      at: Date.now(),
    },
    ...load(),
  ]);
}

export function removeStudySession(id: string) {
  save(load().filter((item) => item.id !== id));
}

export function clearStudySessions() {
  save([]);
}

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  useEffect(() => {
    setSessions(load());
    const refresh = () => setSessions(load());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return sessions;
}
