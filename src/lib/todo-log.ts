import { useCallback, useEffect, useState } from "react";
import { onScopedHydrated, readScoped, writeScoped } from "@/lib/scoped-storage";

export type TodoItem = {
  id: string;
  title: string;
  createdAt: number;
  doneAt: number | null;
};

const STORAGE_KEY = "study-todos";
const CHANGE_EVENT = "study-todos-changed";

function load(): TodoItem[] {
  const parsed = readScoped<TodoItem[]>(STORAGE_KEY) ?? [];
  return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.title === "string") : [];
}

function save(items: TodoItem[]) {
  writeScoped(STORAGE_KEY, items);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useTodos() {
  const [items, setItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(load());
    refresh();
    const offHydrated = onScopedHydrated(refresh);
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      offHydrated();
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
