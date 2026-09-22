import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "profile-photos";

export function useProfileAvatar() {
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      setAvatarPath(null);
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("student_profile")
      .select("avatar_path")
      .eq("id", userId)
      .maybeSingle();
    const path = profile?.avatar_path ?? null;
    setAvatarPath(path);
    if (!path) {
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    setAvatarUrl(data?.signedUrl ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Pilih berkas gambar.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran foto maksimal 5 MB.");
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error("Silakan masuk kembali untuk mengganti foto.");

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userId}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
    if (uploadError) throw uploadError;

    if (avatarPath && avatarPath !== path) await supabase.storage.from(BUCKET).remove([avatarPath]);
    const { error: updateError } = await supabase.from("student_profile").update({ avatar_path: path }).eq("id", userId);
    if (updateError) throw updateError;
    setAvatarPath(path);
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    setAvatarUrl(data?.signedUrl ?? null);
  }, [avatarPath]);

  const remove = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error("Silakan masuk kembali untuk menghapus foto.");
    if (avatarPath) {
      const { error } = await supabase.storage.from(BUCKET).remove([avatarPath]);
      if (error) throw error;
    }
    const { error } = await supabase.from("student_profile").update({ avatar_path: null }).eq("id", userId);
    if (error) throw error;
    setAvatarPath(null);
    setAvatarUrl(null);
  }, [avatarPath]);

  return { avatarUrl, hasAvatar: Boolean(avatarPath), loading, upload, remove, refresh };
}