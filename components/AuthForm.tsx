"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/format";

const inputClass =
  "w-full rounded-xl border border-blush/60 bg-white px-4 py-3 text-sm text-coal outline-none transition-colors focus:border-berry";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-4.1 5.6-7.6 6.5l6.3 5.3C36.8 37.6 44 32 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

type Mode = "login" | "signup";

function friendlyAuthError(raw: string, lang: "en" | "es"): string {
  const lower = raw.toLowerCase();
  if (lower.includes("provider is not enabled") || lower.includes("unsupported provider")) {
    return t(
      "Google sign-in is not turned on yet. Use email and password, or ask the shop owner to enable Google in Supabase.",
      "El inicio con Google aún no está activado. Usa correo y contraseña, o pide al administrador que active Google en Supabase.",
      lang,
    );
  }
  return raw;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configured, signIn, signUp, signInWithOAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  useEffect(() => {
    const fromUrl = searchParams.get("error");
    if (fromUrl) setError(friendlyAuthError(fromUrl, lang));
  }, [searchParams, lang]);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-blush/50 bg-white p-6 text-center shadow-sm">
        <p className="text-coal/80">
          {t(
            "Sign-in is not available yet. Add Supabase env vars to enable accounts.",
            "El inicio de sesión aún no está disponible. Agrega las variables de Supabase para activar cuentas.",
            lang,
          )}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (mode === "signup") {
      if (password !== confirm) {
        setError(t("Passwords do not match", "Las contraseñas no coinciden", lang));
        return;
      }
      if (password.length < 6) {
        setError(t("Password must be at least 6 characters", "La contraseña debe tener al menos 6 caracteres", lang));
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const result = await signIn(email.trim(), password);
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await signUp(name.trim(), email.trim(), password);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.needsConfirmation) {
          setInfo(
            t(
              "Check your email to confirm your account, then sign in.",
              "Revisa tu correo para confirmar tu cuenta y luego inicia sesión.",
              lang,
            ),
          );
          return;
        }
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const result = await signInWithOAuth();
    if (result.error) setError(friendlyAuthError(result.error, lang));
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl text-berry">
        {mode === "login" ? t("Sign in", "Iniciar sesión", lang) : t("Create account", "Crear cuenta", lang)}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-coal/80">
              {t("Name", "Nombre", lang)}
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-coal/80">
            {t("Email", "Correo", lang)}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-coal/80">
            {t("Password", "Contraseña", lang)}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-coal/60 hover:text-berry"
              aria-label={
                showPassword
                  ? t("Hide password", "Ocultar contraseña", lang)
                  : t("Show password", "Mostrar contraseña", lang)
              }
            >
              {showPassword ? t("Hide", "Ocultar", lang) : t("Show", "Mostrar", lang)}
            </button>
          </div>
        </div>

        {mode === "signup" && (
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-coal/80">
              {t("Confirm password", "Confirmar contraseña", lang)}
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-coal/60 hover:text-berry"
                aria-label={
                  showConfirm
                    ? t("Hide password", "Ocultar contraseña", lang)
                    : t("Show password", "Mostrar contraseña", lang)
                }
              >
                {showConfirm ? t("Hide", "Ocultar", lang) : t("Show", "Mostrar", lang)}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-berry">{error}</p>}
        {info && <p className="text-sm text-coal/70">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full rounded-full bg-berry px-5 py-3 text-sm font-medium text-white shadow-md hover:bg-berry-hover disabled:opacity-60"
        >
          {submitting
            ? t("Please wait…", "Espera…", lang)
            : mode === "login"
              ? t("Sign in", "Iniciar sesión", lang)
              : t("Create account", "Crear cuenta", lang)}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-blush/60" />
        <span className="text-xs text-coal/50">{t("or", "o", lang)}</span>
        <div className="h-px flex-1 bg-blush/60" />
      </div>
      <button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-coal/15 bg-white px-5 py-3 text-sm font-medium text-coal transition-colors hover:border-berry/40 hover:text-berry"
      >
        <GoogleLogo />
        {t("Continue with Google", "Continuar con Google", lang)}
      </button>

      <p className="mt-6 text-center text-sm text-coal/70">
        {mode === "login" ? (
          <>
            {t("No account?", "¿No tienes cuenta?", lang)}{" "}
            <Link href="/signup" className="font-medium text-berry hover:underline">
              {t("Sign up", "Regístrate", lang)}
            </Link>
          </>
        ) : (
          <>
            {t("Already have an account?", "¿Ya tienes cuenta?", lang)}{" "}
            <Link href="/login" className="font-medium text-berry hover:underline">
              {t("Sign in", "Iniciar sesión", lang)}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
