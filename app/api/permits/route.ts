import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { addDays } from "date-fns"
import { BlobServiceClient } from "@azure/storage-blob"
import { generatePermitPdf } from "@/lib/pdf-generator"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting permit application submission...")

    const formData = await request.formData()

    // Log received form data (excluding file contents)
    const formDataEntries = Array.from(formData.entries())
      .filter(([key]) => key !== "passportPhoto" && key !== "idDocument")
      .map(([key, value]) => `${key}: ${value}`)

    console.log("Form data received:", formDataEntries)

    // Extract form fields
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const country = formData.get("country") as string
    const address = formData.get("address") as string
    const visitPurpose = formData.get("visitPurpose") as string
    const visitDuration = formData.get("visitDuration") as string

    // Extract files
    const passportPhoto = formData.get("passportPhoto") as File
    const idDocument = formData.get("idDocument") as File

    // Validate required fields
    if (!firstName || !lastName || !email || !country) {
      console.error("Missing required text fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!passportPhoto || !idDocument) {
      console.error("Missing required files")
      return NextResponse.json({ error: "Missing passport photo or ID document" }, { status: 400 })
    }

    console.log("Files received:", {
      passportPhoto: passportPhoto ? `${passportPhoto.name} (${passportPhoto.size} bytes)` : "missing",
      idDocument: idDocument ? `${idDocument.name} (${idDocument.size} bytes)` : "missing",
    })

    // Generate confirmation ID
    const confirmationId = uuidv4().substring(0, 8).toUpperCase()
    console.log("Generated confirmation ID:", confirmationId)

    // Calculate validity period
    const validFrom = addDays(new Date(), 1)
    const validUntil = addDays(validFrom, Number.parseInt(visitDuration) || 7)

    try {
      console.log("Connecting to Azure Blob Storage...")
      // Upload files to Azure Blob Storage
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
      if (!connectionString) {
        return NextResponse.json({ error: "Azure Storage connection string is not configured" }, { status: 500 })
      }

      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)

      // Use the environment variables for container names
      const photoContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME_IMAGE || "photo"
      const idContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME_ID || "idphoto"

      console.log("Using containers:", { photoContainerName, idContainerName })

      // Upload passport photo to photo container
      console.log("Creating/accessing photo container...")
      const photoContainerClient = blobServiceClient.getContainerClient(photoContainerName)
      await photoContainerClient.createIfNotExists()

      // Upload passport photo
      const passportPhotoExt = passportPhoto.name.split(".").pop() || "jpg"
      const passportPhotoFilename = `${confirmationId}-passport-photo.${passportPhotoExt}`
      console.log("Uploading passport photo as:", passportPhotoFilename)

      const passportPhotoBlob = photoContainerClient.getBlockBlobClient(passportPhotoFilename)
      const passportPhotoBuffer = Buffer.from(await passportPhoto.arrayBuffer())
      await passportPhotoBlob.upload(passportPhotoBuffer, passportPhotoBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: passportPhoto.type || "image/jpeg", // Set the correct content type
        },
      })
      const passportPhotoUrl = passportPhotoBlob.url
      console.log("Passport photo uploaded successfully:", passportPhotoUrl)

      // Upload ID document to idphoto container
      console.log("Creating/accessing ID document container...")
      const idContainerClient = blobServiceClient.getContainerClient(idContainerName)
      await idContainerClient.createIfNotExists()

      // Upload ID document
      const idDocumentExt = idDocument.name.split(".").pop() || "jpg"
      const idDocumentFilename = `${confirmationId}-id-document.${idDocumentExt}`
      console.log("Uploading ID document as:", idDocumentFilename)

      const idDocumentBlob = idContainerClient.getBlockBlobClient(idDocumentFilename)
      const idDocumentBuffer = Buffer.from(await idDocument.arrayBuffer())
      await idDocumentBlob.upload(idDocumentBuffer, idDocumentBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: idDocument.type || "image/jpeg", // Set the correct content type
        },
      })
      const idDocumentUrl = idDocumentBlob.url
      console.log("ID document uploaded successfully:", idDocumentUrl)

      // Generate PDF
      console.log("Generating PDF...")
      const permitData = {
        confirmationId,
        firstName,
        lastName,
        email,
        phone,
        country,
        address,
        visitPurpose,
        visitDuration,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
        passportPhotoUrl,
        idDocumentUrl,
      }

      const pdfBuffer = await generatePermitPdf(permitData)
      console.log("PDF generated successfully")

      // For the PDF, we'll create a "permits" container if it doesn't exist
      console.log("Creating/accessing permits container...")
      const pdfContainerClient = blobServiceClient.getContainerClient("permits")
      await pdfContainerClient.createIfNotExists()

      // Upload PDF to "permits" container
      const pdfFilename = `${confirmationId}-permit.pdf`
      console.log("Uploading PDF as:", pdfFilename)

      const pdfBlob = pdfContainerClient.getBlockBlobClient(pdfFilename)
      await pdfBlob.upload(pdfBuffer, pdfBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: "application/pdf",
        },
      })
      const pdfUrl = pdfBlob.url
      console.log("PDF uploaded successfully:", pdfUrl)

      // Save to PostgreSQL database
      console.log("Saving to database...")
      const result = await query(
        `
        INSERT INTO permits (
          confirmation_id, 
          first_name, 
          last_name, 
          email, 
          phone, 
          country, 
          address, 
          visit_purpose, 
          visit_duration, 
          valid_from, 
          valid_until, 
          passport_photo_url, 
          id_document_url, 
          pdf_url
        ) 
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) 
        RETURNING id
      `,
        [
          confirmationId,
          firstName,
          lastName,
          email,
          phone || "",
          country,
          address || "",
          visitPurpose || "",
          visitDuration || "7",
          validFrom.toISOString(),
          validUntil.toISOString(),
          passportPhotoUrl,
          idDocumentUrl,
          pdfUrl,
        ],
      )

      console.log("Database record created with ID:", result.rows[0]?.id)

      return NextResponse.json({
        success: true,
        confirmationId,
        id: result.rows[0]?.id,
      })
    } catch (uploadError) {
      console.error("Error during file upload or database operation:", uploadError)
      return NextResponse.json({ error: `File upload or database error: ${uploadError.message}` }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing permit application:", error)
    return NextResponse.json({ error: `Failed to process application: ${error.message}` }, { status: 500 })
  }
}
