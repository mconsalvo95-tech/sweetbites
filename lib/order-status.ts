import { t } from "./format";
import type { Fulfillment, Lang } from "./types";

export const ORDER_TAB_STATUSES = ["pending", "completed", "sent", "done", "cancelled"] as const;
export type OrderTabStatus = (typeof ORDER_TAB_STATUSES)[number];

export function customerOrderStatusLabel(status: string, lang: Lang): string {
  switch (status) {
    case "pending":
      return t("Pending", "Pendiente", lang);
    case "completed":
      return t("Picked up", "Recogido", lang);
    case "sent":
      return t("Shipped", "Enviado", lang);
    case "done":
      return t("Done", "Listo", lang);
    case "cancelled":
      return t("Cancelled", "Cancelado", lang);
    default:
      return status;
  }
}

/** Mid-fulfillment: picked up or shipped, not yet archived as done. */
export function isMidFulfillmentStatus(status: string) {
  return status === "completed" || status === "sent";
}

export function fulfilledStatusFor(fulfillment: Fulfillment): "sent" | "completed" {
  return fulfillment === "ship" ? "sent" : "completed";
}

export function reopenStatusFor(fulfillment: Fulfillment): "sent" | "completed" {
  return fulfilledStatusFor(fulfillment);
}

export function canEraseOrdersTab(status: string) {
  return isMidFulfillmentStatus(status) || status === "done" || status === "cancelled";
}

/** Next status when bulk-applying the tab’s main action to one order. */
export function bulkStatusForOrder(tab: OrderTabStatus, fulfillment: Fulfillment): string {
  switch (tab) {
    case "pending":
      return fulfilledStatusFor(fulfillment);
    case "completed":
    case "sent":
      return "done";
    case "done":
      return reopenStatusFor(fulfillment);
    case "cancelled":
      return "pending";
  }
}

export function bulkOrderActionLabel(tab: OrderTabStatus, lang: Lang): string {
  switch (tab) {
    case "pending":
      return t("Mark selected", "Marcar seleccionados", lang);
    case "completed":
    case "sent":
      return t("Done", "Listo", lang);
    case "done":
      return t("Reopen", "Reabrir", lang);
    case "cancelled":
      return t("Restore", "Restaurar", lang);
  }
}
