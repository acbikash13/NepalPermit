import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

const SESSION_COOKIE_NAME = "admin_session"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      const result = await query(
        `
        SELECT 
          id, 
          confirmation_id as "confirmationId", 
          first_name as "firstName", 
          last_name as "lastName", 
          email, 
          country, 
          created_at as "createdAt", 
          passport_photo_url as "passportPhotoUrl"
        FROM permits 
        ORDER BY created_at DESC
        `,
        [],
      )

      return NextResponse.json(result.rows)
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 })
    }
  } catch (error) {
    console.error("Error fetching permits:", error)
    return NextResponse.json({ error: `Failed to fetch permits: ${error.message}` }, { status: 500 })
  }
}
