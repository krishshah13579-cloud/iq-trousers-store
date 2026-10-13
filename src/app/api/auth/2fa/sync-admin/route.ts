import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { TWO_FACTOR_COOKIE, createTwoFactorToken } from "@/lib/twoFactor";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
      // If not an admin, nothing to set, just return success
      return NextResponse.json({ success: true, isAdmin: false });
    }

    const userId = (session.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user ID" }, { status: 400 });
    }

    const token = createTwoFactorToken(userId);
    const res = NextResponse.json({ success: true, isAdmin: true });

    // Set 7-day secure HTTP-only cookie for admin section
    res.cookies.set({
      name: TWO_FACTOR_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Failed to sync admin 2FA session:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
