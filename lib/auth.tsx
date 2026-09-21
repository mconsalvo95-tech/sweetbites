"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./supabase-browser";
import { isSupabaseConfigured } from "./supabase";

export type UserRole = "customer" | "wholesale" | "admin";

export type Profile = {
  id: string;
  display_name: string | null;
  phone: string | null;
  role: UserRole;
  newsletter: boolean;
  address_street: string | null;
  address_city: string | null;
  address_province: string | null;
  address_postal: string | null;
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithOAuth: (provider: "google" | "facebook") => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "display_name" | "phone" | "newsletter" | "address_street" | "address_city" | "address_province" | "address_postal">>) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, phone, role, newsletter, address_street, address_city, address_province, address_postal")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(configured);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(await fetchProfile(user.id));
  }, [user]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      setProfile(nextUser ? await fetchProfile(nextUser.id) : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) setProfile(null);
      else fetchProfile(nextUser.id).then(setProfile);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetchProfile(user.id).then(setProfile);
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: "Auth not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: "Auth not configured" };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    if (!data.session) return { needsConfirmation: true };
    return {};
  }, []);

  const signInWithOAuth = useCallback(async (provider: "google" | "facebook") => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: "Auth not configured" };
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/auth/callback` },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<Profile, "display_name" | "phone" | "newsletter" | "address_street" | "address_city" | "address_province" | "address_postal">>) => {
      const supabase = getSupabaseBrowser();
      if (!supabase || !user) return { error: "Not signed in" };
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) return { error: error.message };
      await refreshProfile();
      return {};
    },
    [user, refreshProfile],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [user, profile, loading, configured, signIn, signUp, signInWithOAuth, signOut, refreshProfile, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
