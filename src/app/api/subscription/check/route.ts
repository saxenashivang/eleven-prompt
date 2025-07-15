import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 🔒 Replace with your extension origin in prod
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const { userId } = await request.json();

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking subscription status:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to check subscription" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const hasSubscription = !!subscription;
    const plan = subscription ? "premium" : "free";

    return new NextResponse(
      JSON.stringify({
        active: hasSubscription,
        hasSubscription,
        plan,
        subscription: subscription || null,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Subscription check error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
