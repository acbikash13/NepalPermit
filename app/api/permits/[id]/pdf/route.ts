import { type NextRequest, NextResponse } from "next/server"
import { generatePermitPdf } from "@/lib/pdf-generator"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const {id} =  await context.params;


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

    const permitData = result.rows[0]

    // If we already have a PDF URL, we could redirect to it
    // But for this example, we'll regenerate the PDF
    const pdfBuffer = await generatePermitPdf(permitData)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="permit-${permitData.confirmationId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
