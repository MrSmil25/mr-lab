import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tasks and academic milestones stored in Supabase.
 * Nothing here is hardcoded: every due date, priority and milestone comes from
 * the signed-in student's own rows.
 */

export type TaskRow = {
  id: string;
  title: string;
  course_code: string | null;
  course_name: string | null;
  category: string | null;
  description: string | null;
  due_at: string | null;
  priority: string;
  status: string;
  done: boolean;
};

export type MilestoneRow = {
  id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  course_code: string | null;
  starts_at: string;
  ends_at: string | null;
};

const TASK_COLUMNS = "id, title, course_code, course_name, category, description, due_at, priority, status, done";
const MILESTONE_COLUMNS = "id, milestone_type, title, description, course_code, starts_at, ends_at";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useStudentTasks() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const userId = await currentUserId();
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("student_tasks")
      .select(TASK_COLUMNS)
      .eq("student_id", userId)
      .order("due_at", { ascending: true, nullsFirst: false });
    setRows((data as TaskRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (task: Omit<TaskRow, "id">) => {
      const userId = await currentUserId();
      if (!userId) return;
      await supabase.from("student_tasks").insert({ ...task, student_id: userId });
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Omit<TaskRow, "id">>) => {
      setRows((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      await supabase.from("student_tasks").update(patch).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setRows((items) => items.filter((item) => item.id !== id));
      await supabase.from("student_tasks").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  return { rows, loading, refresh, create, update, remove };
}

export function useAcademicMilestones() {
  const [rows, setRows] = useState<MilestoneRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const userId = await currentUserId();
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("academic_milestones")
      .select(MILESTONE_COLUMNS)
      .eq("student_id", userId)
      .order("starts_at", { ascending: true });
    setRows((data as MilestoneRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}
