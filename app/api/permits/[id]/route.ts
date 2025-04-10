import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const {id} =  await context.params;
    console.log("\n\n\nFetching permit with ID:", id + "\n\n\n\n\n")

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
        valid_from as "validFrom", 
        valid_until as "validUntil"
      FROM permits 
      WHERE confirmation_id = $1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Permit not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching permit:", error)
    return NextResponse.json({ error: "Failed to fetch permit" }, { status: 500 })
  }
}
