import { NextResponse } from "next/server";
import { EMAIL_RE } from "@/lib/format";
import { InquiryError, submitInquiry, type SubmitInquiryInput } from "@/lib/inquiries";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`inquiry:${clientIp(request)}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
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
    if (err instanceof InquiryError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("inquiry failed", err);
    return NextResponse.json({ error: "Inquiry failed" }, { status: 500 });
  }
}
