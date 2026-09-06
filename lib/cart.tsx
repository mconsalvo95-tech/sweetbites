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
import type { CartLine, Fulfillment } from "./types";
import { uid } from "./format";

type CartContextValue = {
  lines: CartLine[];
  fulfillment: Fulfillment;
  setFulfillment: (f: Fulfillment) => void;
  addLine: (line: Omit<CartLine, "lineId">) => void;
  updateQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  itemCount: number;
  foodTotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "sweetbites-cart";
const FULFILLMENT_KEY = "sweetbites-fulfillment";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function loadFulfillment(): Fulfillment {
  const raw = localStorage.getItem(FULFILLMENT_KEY);
  return raw === "ship" ? "ship" : "pickup";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [fulfillment, setFulfillmentState] = useState<Fulfillment>("pickup");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(loadCart());
    setFulfillmentState(loadFulfillment());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const setFulfillment = useCallback((f: Fulfillment) => {
    setFulfillmentState(f);
    localStorage.setItem(FULFILLMENT_KEY, f);
  }, []);

  const addLine = useCallback((line: Omit<CartLine, "lineId">) => {
    setLines((prev) => {
      const existing = prev.find(
        (l) =>
          l.productId === line.productId &&
          JSON.stringify(l.optionsJson) === JSON.stringify(line.optionsJson),
      );
      if (existing) {
        return prev.map((l) =>
          l.lineId === existing.lineId ? { ...l, qty: l.qty + line.qty } : l,
        );
      }
      return [...prev, { ...line, lineId: uid() }];
    });
  }, []);

  const updateQty = useCallback((lineId: string, qty: number) => {
    if (qty < 1) {
      setLines((prev) => prev.filter((l) => l.lineId !== lineId));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, qty } : l)),
    );
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines],
  );

  const foodTotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      fulfillment,
      setFulfillment,
      addLine,
      updateQty,
      removeLine,
      clearCart,
      itemCount,
      foodTotalCents,
    }),
    [
      lines,
      fulfillment,
      setFulfillment,
      addLine,
      updateQty,
      removeLine,
      clearCart,
      itemCount,
      foodTotalCents,
    ],
  );

  if (!ready) return null;

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
