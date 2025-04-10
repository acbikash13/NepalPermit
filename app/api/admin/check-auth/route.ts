import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "admin_session"

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Decode and verify the session token
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString())

      // Check if the session has expired
      if (sessionData.exp < Date.now()) {
        cookies().delete(SESSION_COOKIE_NAME)
        return NextResponse.json({ error: "Session expired" }, { status: 401 })
      }

      return NextResponse.json({ authenticated: true })
    } catch (error) {
      cookies().delete(SESSION_COOKIE_NAME)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}
