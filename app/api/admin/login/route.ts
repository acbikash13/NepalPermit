import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// In a real application, you would use a proper authentication system
// This is a simplified example for demonstration purposes
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123"
const SESSION_COOKIE_NAME = "admin_session"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create a session token (in a real app, this would be a JWT or similar)
      const sessionToken = Buffer.from(
        JSON.stringify({
          username,
          exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        }),
      ).toString("base64")

      // Set the session cookie
      cookies().set({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        path: "/",
        maxAge: 24 * 60 * 60, // 24 hours
        sameSite: "strict",
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
