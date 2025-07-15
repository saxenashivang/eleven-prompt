import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ error: "Email and password are required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (data.user && data.session) {
      return new NextResponse(
        JSON.stringify({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          },
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 401, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Sign-in API error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Shared CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or specify your extension origin
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
