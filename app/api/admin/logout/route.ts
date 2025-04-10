import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "admin_session"

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    cookies().delete(SESSION_COOKIE_NAME)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
