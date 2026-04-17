import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const { email, role, company } = await request
    .json()
    .catch(() => ({ email: null, role: null, company: null }));

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailPattern.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (
    typeof role !== "string" ||
    !role.trim() ||
    typeof company !== "string" ||
    !company.trim()
  ) {
    return NextResponse.json(
      { error: "Missing role or company" },
      { status: 400 },
    );
  }

  const { data: existingRows, error: existingError } = await supabaseAdminClient
    .from("Waitlist")
    .select("id")
    .eq("Email", normalizedEmail)
    .limit(1);

  if (existingError) {
    return NextResponse.json({ error: "Unknown" }, { status: 500 });
  }

  if (existingRows && existingRows.length > 0) {
    return NextResponse.json({ error: "Already on list" }, { status: 409 });
  }

  const { error } = await supabaseAdminClient
    .from("Waitlist")
    .insert({
      Email: normalizedEmail,
      Role: role.trim(),
      Company: company.trim(),
    });

  if (error) {
    const isDuplicate =
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate key");

    if (isDuplicate) {
      return NextResponse.json(
        { error: "Already on list" },
        { status: 409 },
      );
    }

    console.error("Waitlist insert failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    const devMessage =
      process.env.NODE_ENV === "development"
        ? `${error.code ?? "no_code"}: ${error.message}`
        : undefined;

    return NextResponse.json(
      { error: "Unknown", message: devMessage },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

