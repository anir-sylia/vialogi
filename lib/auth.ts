import { createSupabaseAnonServerClient } from "@/utils/supabase/server";

export type Profile = {
  id: string;
  role: "client" | "transporteur";
  first_name: string;
  last_name: string;
  phone: string;
  transport_type: string | null;
  created_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createSupabaseAnonServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}
