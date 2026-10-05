"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { formatCad, t } from "@/lib/format";
import { canCustomerCancel } from "@/lib/types";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const TABS = [
  { id: "orders", labelEn: "Orders", labelEs: "Pedidos" },
  { id: "wholesale", labelEn: "Wholesale", labelEs: "Mayoreo" },
  { id: "information", labelEn: "Information", labelEs: "Información" },
  { id: "addresses", labelEn: "Addresses", labelEs: "Direcciones" },
  { id: "security", labelEn: "Security", labelEs: "Seguridad" },
  { id: "notifications", labelEn: "Notifications", labelEs: "Notificaciones" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type UserOrder = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  fulfillment: string;
};

const inputClass =
  "w-full rounded-xl border border-blush/60 bg-white px-4 py-3 text-sm text-coal outline-none transition-colors focus:border-berry";

export function AccountClient() {
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading, configured, updateProfile, signOut } = useAuth();

  const tabParam = searchParams.get("tab");
  const tab: TabId =
    TABS.some((item) => item.id === tabParam) ? (tabParam as TabId) : "orders";
  const setTab = useCallback(
    (next: TabId) => {
      router.replace(`/account?tab=${next}`, { scroll: false });
    },
    [router],
  );

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancelBusy, setCancelBusy] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postal, setPostal] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrMsg, setAddrMsg] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [newsletter, setNewsletter] = useState(false);
  const [newsSaving, setNewsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setPhone(profile.phone ?? "");
    setStreet(profile.address_street ?? "");
    setCity(profile.address_city ?? "");
    setProvince(profile.address_province ?? "");
    setPostal(profile.address_postal ?? "");
    setNewsletter(profile.newsletter);
  }, [profile]);

  useEffect(() => {
    if (tab !== "orders" || !user || !configured) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    setOrdersLoading(true);
    supabase
      .from("orders")
      .select("id, status, total_cents, created_at, fulfillment")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as UserOrder[]) ?? []);
        setOrdersLoading(false);
      });
  }, [tab, user, configured]);

  const providers = useMemo(() => {
    if (!user?.identities) return [];
    return user.identities.map((i) => i.provider);
  }, [user]);

  const hasEmailProvider = providers.includes("email");

  if (loading || !user) {
    return (
      <div className="py-12 text-center text-coal/60">
        {t("Loading…", "Cargando…", lang)}
      </div>
    );
  }

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg("");
    setInfoSaving(true);
    const result = await updateProfile({
      display_name: displayName.trim() || null,
      phone: phone.trim() || null,
    });
    setInfoSaving(false);
    setInfoMsg(result.error ?? t("Saved", "Guardado", lang));
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrMsg("");
    setAddrSaving(true);
    const result = await updateProfile({
      address_street: street.trim() || null,
      address_city: city.trim() || null,
      address_province: province.trim() || null,
      address_postal: postal.trim() || null,
    });
    setAddrSaving(false);
    setAddrMsg(result.error ?? t("Address saved", "Dirección guardada", lang));
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg("");
    if (newPassword.length < 6) {
      setPwMsg(t("Password must be at least 6 characters", "La contraseña debe tener al menos 6 caracteres", lang));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg(t("Passwords do not match", "Las contraseñas no coinciden", lang));
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) setPwMsg(error.message);
    else {
      setPwMsg(t("Password updated", "Contraseña actualizada", lang));
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const toggleNewsletter = async () => {
    const next = !newsletter;
    setNewsletter(next);
    setNewsSaving(true);
    const result = await updateProfile({ newsletter: next });
    setNewsSaving(false);
    if (result.error) setNewsletter(!next);
  };

  const cancelOrder = async (id: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const ok = window.confirm(
      t("Cancel this order? The shop will stop preparing it.", "¿Cancelar este pedido? La tienda dejará de prepararlo.", lang),
    );
    if (!ok) return;
    setCancelBusy(id);
    const { error } = await supabase.rpc("cancel_own_order", { order_id: id });
    setCancelBusy(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    setOrders((rows) => rows.map((row) => (row.id === id ? { ...row, status: "cancelled" } : row)));
  };

  const role = profile?.role ?? "customer";

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-berry">{t("My account", "Mi cuenta", lang)}</h1>
        <button
          type="button"
          onClick={() => signOut().then(() => router.push("/"))}
          className="text-sm font-medium text-coal/70 hover:text-berry"
        >
          {t("Sign out", "Cerrar sesión", lang)}
        </button>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label={t("Account sections", "Secciones de cuenta", lang)}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-berry text-white"
                : "bg-blush/40 text-coal/80 hover:bg-blush/70"
            }`}
          >
            {lang === "es" ? item.labelEs : item.labelEn}
          </button>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl border border-blush/50 bg-white p-6 shadow-sm">
        {tab === "orders" && (
          <div>
            <h2 className="text-lg font-semibold text-coal">{t("Order history", "Historial de pedidos", lang)}</h2>
            {!configured ? (
              <p className="mt-4 text-sm text-coal/60">
                {t("Connect Supabase to sync orders to your account.", "Conecta Supabase para sincronizar pedidos con tu cuenta.", lang)}
              </p>
            ) : ordersLoading ? (
              <p className="mt-4 text-sm text-coal/60">{t("Loading…", "Cargando…", lang)}</p>
            ) : orders.length === 0 ? (
              <p className="mt-4 text-sm text-coal/60">
                {t("No orders yet. Guest orders placed before sign-in stay on your device.", "Aún no hay pedidos. Los pedidos como invitado antes de iniciar sesión quedan en tu dispositivo.", lang)}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-coal/10">
                {orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <Link href={`/order-status/${order.id}`} className="font-medium text-berry hover:underline">
                        #{order.id.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-coal/50">
                        {new Date(order.created_at).toLocaleDateString(lang === "es" ? "es" : "en")}
                        {" · "}
                        {order.fulfillment}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-medium">{formatCad(order.total_cents)}</p>
                        <p className="text-xs capitalize text-coal/50">{order.status}</p>
                      </div>
                      {canCustomerCancel(order.status) && (
                        <button
                          type="button"
                          disabled={cancelBusy === order.id}
                          onClick={() => void cancelOrder(order.id)}
                          className="text-sm text-coal/50 hover:text-berry hover:underline disabled:opacity-50"
                        >
                          {cancelBusy === order.id
                            ? t("Cancelling…", "Cancelando…", lang)
                            : t("Cancel", "Cancelar", lang)}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "wholesale" && (
          <div>
            <h2 className="text-lg font-semibold text-coal">{t("Wholesale status", "Estado de mayoreo", lang)}</h2>
            <span className="mt-3 inline-block rounded-full bg-mint/30 px-3 py-1 text-sm font-medium capitalize text-coal">
              {role}
            </span>
            {role === "customer" ? (
              <div className="mt-4">
                <p className="text-sm text-coal/70">
                  {t("Interested in wholesale pricing?", "¿Te interesa precio de mayoreo?", lang)}
                </p>
                <Link
                  href="/wholesale"
                  className="btn-primary mt-3 inline-block rounded-full bg-berry px-5 py-2.5 text-sm font-medium text-white hover:bg-berry-hover"
                >
                  {t("Apply for wholesale", "Solicitar mayoreo", lang)}
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-coal/70">
                {t("Your wholesale account is approved. Our team will reach out with pricing.", "Tu cuenta de mayoreo está aprobada. Nuestro equipo se comunicará con precios.", lang)}
              </p>
            )}
          </div>
        )}

        {tab === "information" && (
          <form onSubmit={saveInfo}>
            <h2 className="text-lg font-semibold text-coal">{t("Your information", "Tu información", lang)}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-coal/80">
                  {t("Display name", "Nombre", lang)}
                </label>
                <input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-coal/80">
                  {t("Phone", "Teléfono", lang)}
                </label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-coal/80">
                  {t("Email", "Correo", lang)}
                </label>
                <input id="email" type="email" value={user.email ?? ""} readOnly className={`${inputClass} bg-cream/50 text-coal/60`} />
              </div>
            </div>
            {infoMsg && <p className="mt-3 text-sm text-coal/70">{infoMsg}</p>}
            <button
              type="submit"
              disabled={infoSaving}
              className="btn-primary mt-4 rounded-full bg-berry px-5 py-2.5 text-sm font-medium text-white hover:bg-berry-hover disabled:opacity-60"
            >
              {infoSaving ? t("Saving…", "Guardando…", lang) : t("Save", "Guardar", lang)}
            </button>
          </form>
        )}

        {tab === "addresses" && (
          <div>
            <h2 className="text-lg font-semibold text-coal">{t("Saved addresses", "Direcciones guardadas", lang)}</h2>
            {street || city ? (
              <div className="mt-4 rounded-xl border border-blush/40 bg-cream/30 p-4 text-sm text-coal/80">
                <p className="font-medium">{t("Default address", "Dirección predeterminada", lang)}</p>
                <p className="mt-1">{street}</p>
                <p>{city}{province ? `, ${province}` : ""} {postal}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-coal/60">{t("No saved addresses yet.", "Aún no hay direcciones guardadas.", lang)}</p>
            )}
            <form onSubmit={saveAddress} className="mt-6 space-y-4">
              <p className="text-sm font-medium text-coal">{t("Add / edit address", "Agregar / editar dirección", lang)}</p>
              <input placeholder={t("Street", "Calle", lang)} value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
              <input placeholder={t("City", "Ciudad", lang)} value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={t("Province", "Provincia", lang)} value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass} />
                <input placeholder={t("Postal code", "Código postal", lang)} value={postal} onChange={(e) => setPostal(e.target.value)} className={inputClass} />
              </div>
              {addrMsg && <p className="text-sm text-coal/70">{addrMsg}</p>}
              <button
                type="submit"
                disabled={addrSaving}
                className="btn-primary rounded-full bg-berry px-5 py-2.5 text-sm font-medium text-white hover:bg-berry-hover disabled:opacity-60"
              >
                {addrSaving ? t("Saving…", "Guardando…", lang) : t("Save address", "Guardar dirección", lang)}
              </button>
            </form>
          </div>
        )}

        {tab === "security" && (
          <div>
            <h2 className="text-lg font-semibold text-coal">{t("Security", "Seguridad", lang)}</h2>
            <div className="mt-4">
              <p className="text-sm font-medium text-coal">{t("Connected accounts", "Cuentas conectadas", lang)}</p>
              <ul className="mt-2 space-y-1 text-sm text-coal/70">
                {providers.length === 0 && <li>{t("Email & password", "Correo y contraseña", lang)}</li>}
                {providers.includes("google") && <li>Google</li>}
                {providers.includes("facebook") && <li>Facebook</li>}
                {hasEmailProvider && <li>{t("Email & password", "Correo y contraseña", lang)}</li>}
              </ul>
            </div>
            {hasEmailProvider && (
              <form onSubmit={changePassword} className="mt-6 space-y-4">
                <p className="text-sm font-medium text-coal">{t("Change password", "Cambiar contraseña", lang)}</p>
                <input
                  type="password"
                  placeholder={t("New password", "Nueva contraseña", lang)}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder={t("Confirm new password", "Confirmar nueva contraseña", lang)}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
                {pwMsg && <p className="text-sm text-coal/70">{pwMsg}</p>}
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="btn-primary rounded-full bg-berry px-5 py-2.5 text-sm font-medium text-white hover:bg-berry-hover disabled:opacity-60"
                >
                  {pwSaving ? t("Updating…", "Actualizando…", lang) : t("Update password", "Actualizar contraseña", lang)}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === "notifications" && (
          <div>
            <h2 className="text-lg font-semibold text-coal">{t("Notifications", "Notificaciones", lang)}</h2>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-blush/40 p-4">
              <div>
                <p className="font-medium text-coal">{t("Newsletter", "Boletín", lang)}</p>
                <p className="text-sm text-coal/60">
                  {t("Get updates on new treats and promos.", "Recibe novedades sobre postres y promos.", lang)}
                </p>
              </div>
              <input
                type="checkbox"
                checked={newsletter}
                disabled={newsSaving}
                onChange={toggleNewsletter}
                className="h-5 w-5 accent-berry"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
