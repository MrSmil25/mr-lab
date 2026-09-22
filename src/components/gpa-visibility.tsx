import { Eye, EyeOff } from "lucide-react";
import { useSyncExternalStore } from "react";

// Status sembunyi IPK dibagikan ke seluruh aplikasi dan disimpan di localStorage.
const STORAGE_KEY = "gpa-hidden";
let hidden = true;
let initialized = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  if (!initialized && typeof localStorage !== "undefined") {
    initialized = true;
    hidden = localStorage.getItem(STORAGE_KEY) !== "false";
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return hidden;
}

function toggle() {
  hidden = !hidden;
  try {
    localStorage.setItem(STORAGE_KEY, String(hidden));
  } catch {
    // Abaikan jika penyimpanan tidak tersedia.
  }
  listeners.forEach((listener) => listener());
}

export function useGpaHidden() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

export function GpaEyeButton({ className = "" }: { className?: string }) {
  const isHidden = useGpaHidden();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isHidden ? "Tampilkan IPK" : "Sembunyikan IPK"}
      className={`inline-grid size-5 shrink-0 place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100 ${className}`}
    >
      {isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </button>
  );
}

/** Menampilkan nilai IPK, atau "•••" saat mode sembunyi aktif. */
export function GpaValue({ value, className = "" }: { value: string; className?: string }) {
  const isHidden = useGpaHidden();
  return <span className={className}>{isHidden ? "•••" : value}</span>;
}
