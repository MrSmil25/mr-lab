import { useCallback, useEffect, useState } from "react";

export type TodoItem = {
  id: string;
  title: string;
  createdAt: number;
  doneAt: number | null;
};

const STORAGE_KEY = "study-todos";
const CHANGE_EVENT = "study-todos-changed";

function load(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as TodoItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.title === "string") : [];
  } catch {
    return [];
  }
}

function save(items: TodoItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useTodos() {
  const [items, setItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    setItems(load());
    const refresh = () => setItems(load());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const add = useCallback((title: string) => {
    const clean = title.trim();
    if (!clean) return;
    save([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: clean, createdAt: Date.now(), doneAt: null }, ...load()]);
  }, []);

  const toggle = useCallback((id: string) => {
    save(load().map((item) => (item.id === id ? { ...item, doneAt: item.doneAt ? null : Date.now() } : item)));
  }, []);

  const remove = useCallback((id: string) => {
    save(load().filter((item) => item.id !== id));
  }, []);

  return { items, add, toggle, remove };
}
