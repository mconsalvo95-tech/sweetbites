import { NextResponse } from "next/server";
import { submitInquiry, type SubmitInquiryInput } from "@/lib/inquiries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitInquiryInput;
    if (!body.type || !body.email?.trim() || !EMAIL_RE.test(body.email.trim())) {
      return NextResponse.json({ error: "Invalid inquiry" }, { status: 400 });
    }
    if (body.type === "wholesale" && (!body.business?.trim() || !body.city?.trim())) {
      return NextResponse.json({ error: "Business and city required" }, { status: 400 });
    }
    if (body.type === "contact" && !body.name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const orderNumber =
      body.type === "contact" && body.orderNumber?.trim()
        ? body.orderNumber.trim().slice(0, 40)
        : undefined;
    const result = await submitInquiry({
      ...body,
      email: body.email.trim(),
      name: body.name?.trim(),
      phone: body.phone?.trim(),
      business: body.business?.trim(),
      city: body.city?.trim(),
      message: body.message?.trim(),
      orderNumber,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Inquiry failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
