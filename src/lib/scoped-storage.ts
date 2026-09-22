/**
 * Penyimpanan lokal yang dipisah per akun.
 *
 * Tanpa ini, data yang tersimpan di perangkat (setup onboarding, tautan
 * semester, catatan roadmap) akan terbawa ke akun berikutnya yang masuk di
 * browser yang sama. Setiap akun sekarang punya ruang penyimpanannya sendiri,
 * sehingga akun baru selalu mulai dari kosong.
 */

const LEGACY_KEYS = ["academic-os.setup.v1", "academic-os.semester.v1", "academic-os.roadmap.v1"];

let currentUserId: string | null = null;

/** Dipanggil saat sesi berubah. Membersihkan sisa data lama yang tidak beridentitas. */
export function setStorageUser(userId: string | null) {
  currentUserId = userId;
  if (typeof window === "undefined") return;
  for (const key of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage tidak tersedia */
    }
  }
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

export function writeScoped(base: string, value: unknown) {
  if (typeof window === "undefined" || !currentUserId) return;
  try {
    window.localStorage.setItem(scopedKey(base), JSON.stringify(value));
  } catch {
    /* penyimpanan penuh */
  }
}

export function removeScoped(base: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(scopedKey(base));
  } catch {
    /* storage tidak tersedia */
  }
}

/** Menghapus seluruh data lokal milik akun yang sedang masuk (dipakai saat keluar). */
export function clearScopedStorage() {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_KEYS) removeScoped(key);
  setStorageUser(null);
}
