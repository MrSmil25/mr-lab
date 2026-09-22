/**
 * Penyimpanan data pribadi per akun.
 *
 * Data disimpan di perangkat (agar cepat dan tetap bisa dibaca saat offline)
 * DAN dicadangkan ke tabel `user_app_state` di database. Dengan begitu catatan,
 * rutinitas, organisasi, jadwal lain, arsip semester, dan to-do tidak hilang
 * ketika pengguna berganti perangkat, membersihkan browser, atau login ulang.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LEGACY_KEYS = ["academic-os.setup.v1", "academic-os.semester.v1", "academic-os.roadmap.v1"];

/** Kunci data pengguna yang ikut dicadangkan ke database. */
export const SYNCED_KEYS = [
  "academic-os.setup.v1",
  "academic-os.semester.v1",
  "academic-os.roadmap.v1",
  "my-room.organizations.v1",
  "my-room.other-schedules.v1",
  "my-room.routines.v1",
  "study-todos",
  "study-sessions",
  "study-notes",
  "harmony.notifications.read",
] as const;

/** Kunci lama yang tidak beridentitas akun, dipindahkan sekali ke ruang akun. */
const LEGACY_GLOBAL_KEYS = ["study-todos", "study-sessions", "study-notes", "harmony.notifications.read"];

const HYDRATED_EVENT = "scoped-storage-hydrated";

let currentUserId: string | null = null;
let hydratedFor: string | null = null;

function notifyHydrated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HYDRATED_EVENT));
}

/** Berlangganan perubahan setelah data akun selesai diambil dari database. */
export function onScopedHydrated(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(HYDRATED_EVENT, callback);
  return () => window.removeEventListener(HYDRATED_EVENT, callback);
}

export function scopedKey(base: string) {
  return currentUserId ? `${base}:${currentUserId}` : base;
}

export function readScoped<T>(base: string): T | null {
  if (typeof window === "undefined" || !currentUserId) return null;
  try {
    const raw = window.localStorage.getItem(scopedKey(base));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(base: string, value: unknown) {
  if (typeof window === "undefined" || !currentUserId) return;
  try {
    window.localStorage.setItem(scopedKey(base), JSON.stringify(value));
  } catch {
    /* penyimpanan penuh */
  }
}

export function writeScoped(base: string, value: unknown) {
  writeLocal(base, value);
  queueRemote(base, value);
}

export function removeScoped(base: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(scopedKey(base));
  } catch {
    /* storage tidak tersedia */
  }
  const userId = currentUserId;
  if (userId) {
    void supabase.from("user_app_state").delete().eq("user_id", userId).eq("key", base);
  }
}

/* ----------------------------- cadangan awan ----------------------------- */

const pending = new Map<string, unknown>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueRemote(base: string, value: unknown) {
  if (!currentUserId) return;
  pending.set(base, value);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushRemote(), 400);
}

async function flushRemote() {
  flushTimer = null;
  const userId = currentUserId;
  if (!userId || pending.size === 0) return;
  const rows = [...pending.entries()].map(([key, value]) => ({ user_id: userId, key, value: value as never }));
  pending.clear();
  const { error } = await supabase.from("user_app_state").upsert(rows, { onConflict: "user_id,key" });
  // Gagal menyimpan (offline): coba lagi pada penyimpanan berikutnya.
  if (error) for (const row of rows) if (!pending.has(row.key)) pending.set(row.key, row.value);
}

/** Memaksa seluruh perubahan tertunda tersimpan sekarang (dipakai sebelum keluar). */
export async function flushScopedStorage() {
  if (flushTimer) clearTimeout(flushTimer);
  await flushRemote().catch(() => {});
}

async function hydrate(userId: string) {
  if (typeof window === "undefined") return;

  // Pindahkan data lama yang belum beridentitas akun ke ruang akun ini.
  for (const key of LEGACY_GLOBAL_KEYS) {
    try {
      const legacy = window.localStorage.getItem(key);
      if (legacy && !window.localStorage.getItem(`${key}:${userId}`)) {
        window.localStorage.setItem(`${key}:${userId}`, legacy);
      }
      window.localStorage.removeItem(key);
    } catch {
      /* storage tidak tersedia */
    }
  }

  const { data, error } = await supabase.from("user_app_state").select("key, value").eq("user_id", userId);
  if (error || currentUserId !== userId) return;

  const remote = new Map((data ?? []).map((row) => [row.key, row.value]));
  for (const [key, value] of remote) {
    if (value === null || value === undefined) continue;
    try {
      window.localStorage.setItem(`${key}:${userId}`, JSON.stringify(value));
    } catch {
      /* penyimpanan penuh */
    }
  }

  // Data yang baru ada di perangkat ini diunggah agar ikut tercadangkan.
  for (const key of SYNCED_KEYS) {
    if (remote.has(key)) continue;
    const local = readScoped<unknown>(key);
    if (local !== null && local !== undefined) queueRemote(key, local);
  }

  hydratedFor = userId;
  notifyHydrated();
}

/** Dipanggil saat sesi berubah. Mengambil cadangan data akun dari database. */
export function setStorageUser(userId: string | null) {
  const changed = currentUserId !== userId;
  currentUserId = userId;
  if (typeof window === "undefined") return;
  if (!changed && hydratedFor === userId) return;
  for (const key of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage tidak tersedia */
    }
  }
  if (!userId) {
    hydratedFor = null;
    return;
  }
  void hydrate(userId).catch(() => {});
}

/** Menghapus penanda akun saat keluar (data tetap tersimpan di database). */
export function clearScopedStorage() {
  if (typeof window === "undefined") return;
  void flushScopedStorage();
  for (const key of LEGACY_KEYS) removeScoped(key);
  setStorageUser(null);
}

/* -------------------------------- hook ----------------------------------- */

/**
 * State milik akun yang otomatis tersimpan ke perangkat + database, dan ikut
 * diperbarui begitu cadangan dari database selesai diambil.
 */
export function useScopedStore<T>(key: string, fallback: T) {
  const fallbackRef = useRef(fallback);
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const read = () => setValue(readScoped<T>(key) ?? fallbackRef.current);
    read();
    return onScopedHydrated(read);
  }, [key]);

  const save = useCallback(
    (next: T) => {
      setValue(next);
      writeScoped(key, next);
    },
    [key],
  );

  return [value, save] as const;
}
