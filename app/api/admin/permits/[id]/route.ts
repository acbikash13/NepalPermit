import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

const SESSION_COOKIE_NAME = "admin_session"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await context.params

    const isNumericId = !isNaN(Number(id));
    const queryCondition = isNumericId ? "id = $1" : "confirmation_id = $1";

    const result = await query(
      `
      SELECT 
        id, 
        confirmation_id as "confirmationId", 
        first_name as "firstName", 
        last_name as "lastName", 
        email, 
        phone, 
        country, 
        address, 
        visit_purpose as "visitPurpose", 
        visit_duration as "visitDuration", 
        created_at as "createdAt", 
        valid_from as "validFrom", 
        valid_until as "validUntil", 
        passport_photo_url as "passportPhotoUrl", 
        id_document_url as "idDocumentUrl"
      FROM permits 
      WHERE ${queryCondition}
      `,
      [isNumericId ? Number(id) : id] // ✅ cast only when using id = $1
    );
    

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching permit details:", error)
    return NextResponse.json({ error: "Failed to fetch permit details" }, { status: 500 })
  }
}
