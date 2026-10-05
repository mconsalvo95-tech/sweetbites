import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Lang } from "./types";
import { getSupabase } from "./supabase";

const LOCAL_FILE = join(process.cwd(), ".local-inquiries.json");

export type InquiryType = "wholesale" | "contact" | "newsletter";

export type InquiryRecord = {
  id: string;
  type: InquiryType;
  lang: Lang;
  email: string;
  name?: string;
  phone?: string;
  business?: string;
  city?: string;
  message?: string;
  orderNumber?: string;
  createdAt: string;
};

export type SubmitInquiryInput = {
  type: InquiryType;
  lang: Lang;
  email: string;
  name?: string;
  phone?: string;
  business?: string;
  city?: string;
  message?: string;
  orderNumber?: string;
};

function readLocal(): InquiryRecord[] {
  if (!existsSync(LOCAL_FILE)) return [];
  try {
    return JSON.parse(readFileSync(LOCAL_FILE, "utf8")) as InquiryRecord[];
  } catch {
    return [];
  }
}

function writeLocal(records: InquiryRecord[]): void {
  writeFileSync(LOCAL_FILE, JSON.stringify(records, null, 2));
}

export async function submitInquiry(input: SubmitInquiryInput): Promise<{ id: string; source: "supabase" | "local" }> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        type: input.type,
        lang: input.lang,
        email: input.email,
        name: input.name ?? null,
        phone: input.phone ?? null,
        business: input.business ?? null,
        city: input.city ?? null,
        message: input.message ?? null,
        ...(typeof input.orderNumber === "string" && input.orderNumber !== ""
          ? { order_number: input.orderNumber }
          : {}),
      })
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to save inquiry");
    return { id: data.id, source: "supabase" };
  }

  // ponytail: file-backed inquiries when Supabase env is unset
  const id = randomUUID();
  const record: InquiryRecord = {
    id,
    type: input.type,
    lang: input.lang,
    email: input.email,
    name: input.name,
    phone: input.phone,
    business: input.business,
    city: input.city,
    message: input.message,
    orderNumber: input.orderNumber,
    createdAt: new Date().toISOString(),
  };
  const records = readLocal();
  records.push(record);
  writeLocal(records);
  return { id, source: "local" };
}
