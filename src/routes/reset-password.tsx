import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password · MY ROOM" },
      { name: "description", content: "Set a new password for your MY ROOM academic workspace." },
      { property: "og:title", content: "Reset password · MY ROOM" },
      { property: "og:description", content: "Set a new password for your MY ROOM academic workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password belum sama.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("Tautan reset sudah kedaluwarsa atau tidak valid. Minta tautan baru dari halaman masuk.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/", replace: true }), 1200);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="academic-card overflow-hidden">
          <div className="h-1.5 bg-primary" />
          <div className="p-6 md:p-7">
            <h1 className="text-xl font-bold">Atur password baru</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {ready
                ? "Masukkan password baru untuk akunmu."
                : "Buka halaman ini lewat tautan yang dikirim ke emailmu agar bisa mengganti password."}
            </p>

            {done ? (
              <p className="mt-5 rounded-xl bg-success/12 p-3 text-xs font-medium text-success">
                Password berhasil diganti. Mengarahkan ke aplikasi…
              </p>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Password baru</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Ulangi password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder="Ketik ulang password"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                {error && <p className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">{error}</p>}

                <Button type="submit" variant="academic" className="w-full" disabled={busy || !ready}>
                  {busy ? <Loader2 className="animate-spin" /> : <KeyRound />} Simpan password baru
                </Button>
              </form>
            )}

            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="mt-5 w-full text-center text-xs font-semibold text-academic"
            >
              Kembali ke halaman masuk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
