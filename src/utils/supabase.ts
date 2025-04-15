import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for gym sessions
export type GymSession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

// Helper function to check if Bobby is at the gym
export async function isBobbyAtGym(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_bobby_at_gym");

  if (error) {
    console.error("Error checking if Bobby is at gym:", error);
    return false;
  }

  return data || false;
}

// Helper function to get the current active session if exists
export async function getCurrentSession(): Promise<GymSession | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("gym_sessions")
    .select("*")
    .lte("start_time", now)
    .gte("end_time", now)
    .order("start_time", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching current session:", error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

// Helper function to get all of Bobby's gym sessions
export async function getBobbyGymSessions(): Promise<GymSession[]> {
  const { data, error } = await supabase
    .from("gym_sessions")
    .select("*")
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error fetching gym sessions:", error);
    return [];
  }

  return data || [];
}

// Helper function to add a new gym session
export async function addGymSession(
  start_time: Date,
  end_time: Date,
  user_id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("gym_sessions")
    .insert([{ user_id, start_time, end_time }]);

  if (error) {
    console.error("Error adding gym session:", error);
    return false;
  }

  return true;
}

// Helper function to delete a gym session
export async function deleteGymSession(id: string): Promise<boolean> {
  const { error } = await supabase.from("gym_sessions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting gym session:", error);
    return false;
  }

  return true;
}

// Helper function to get the danger status
export async function getDangerStatus(): Promise<boolean> {
  const { data, error } = await supabase
    .from("gym_settings")
    .select("value")
    .eq("key", "danger_mode")
    .single();

  if (error) {
    console.error("Error fetching danger status:", error);
    return false;
  }

  return data?.value === "true";
}

// Helper function to set the danger status
export async function setDangerStatus(isDanger: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("gym_settings")
    .upsert(
      { key: "danger_mode", value: isDanger ? "true" : "false" },
      { onConflict: "key" }
    );

  if (error) {
    console.error("Error setting danger status:", error);
    return false;
  }

  return true;
}

// Helper function to get future sessions for today
export async function getFutureSessions(): Promise<GymSession[]> {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("gym_sessions")
    .select("*")
    .gt("start_time", now.toISOString())
    .lte("start_time", endOfDay.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching future sessions:", error);
    return [];
  }

  return data || [];
}
