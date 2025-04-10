import PDFDocument from "pdfkit"

interface PermitData {
  confirmationId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  address: string
  visitPurpose: string
  visitDuration: string
  validFrom: string
  validUntil: string
  passportPhotoUrl?: string
  idDocumentUrl?: string
}

export async function generatePermitPdf(data: PermitData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log("Starting PDF generation...")

      // Create a document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Nepal Protected Areas Permit - ${data.confirmationId}`,
          Author: "Nepal Protected Areas Permit System",
        },
      })

      // Collect the PDF data chunks
      const chunks: Buffer[] = []
      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => {
        console.log("PDF generation completed successfully")
        resolve(Buffer.concat(chunks))
      })
      doc.on("error", (err) => {
        console.error("Error during PDF generation:", err)
        reject(err)
      })

      // Add content to the PDF
      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("Nepal Protected Areas Permit", { align: "center" })

      doc.fontSize(14).font("Helvetica").text("Official Travel Authorization", { align: "center" })

      doc.moveDown(4)

      // Confirmation box
      doc.rect(50, doc.y, doc.page.width - 100, 80).fillAndStroke("#f0f9ff", "#0284c7")

      doc
        .fillColor("#000000")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Confirmation Number:", 70, doc.y - 70)
        .font("Helvetica")
        .text(data.confirmationId, 200, doc.y - 12, { align: "left" })

      doc
        .font("Helvetica-Bold")
        .text("Valid From:", 70, doc.y + 10)
        .font("Helvetica")
        .text(new Date(data.validFrom).toLocaleDateString(), 200, doc.y - 12, { align: "left" })

      doc
        .font("Helvetica-Bold")
        .text("Valid Until:", 70, doc.y + 10)
        .font("Helvetica")
        .text(new Date(data.validUntil).toLocaleDateString(), 200, doc.y - 12, { align: "left" })

      doc.moveDown(3)

      // Applicant information
      doc.fontSize(16).font("Helvetica-Bold").text("Applicant Information", { underline: true })

      doc.moveDown(1)

      const infoTable = [
        { label: "Name", value: `${data.firstName} ${data.lastName}` },
        { label: "Email", value: data.email },
        { label: "Phone", value: data.phone || "Not provided" },
        { label: "Country", value: data.country },
        { label: "Address", value: data.address || "Not provided" },
      ]

      infoTable.forEach((item) => {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(`${item.label}:`, { continued: true, width: 150 })
          .font("Helvetica")
          .text(` ${item.value}`)

        doc.moveDown(0.5)
      })

      doc.moveDown(1)

      // Visit details
      doc.fontSize(16).font("Helvetica-Bold").text("Visit Details", { underline: true })

      doc.moveDown(1)

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Purpose of Visit:", { continued: false })
        .font("Helvetica")
        .text(data.visitPurpose || "Tourism")

      doc.moveDown(0.5)

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Duration:", { continued: true, width: 150 })
        .font("Helvetica")
        .text(` ${data.visitDuration || "7"} days`)

      doc.moveDown(2)

      // Terms and conditions
      doc.fontSize(14).font("Helvetica-Bold").text("Terms and Conditions", { underline: true })

      doc.moveDown(1)

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("1. This permit must be presented along with a valid ID document when entering protected areas.", {
          align: "left",
        })

      doc.text("2. The permit holder must comply with all local regulations and guidelines within protected areas.", {
        align: "left",
      })

      doc.text("3. This permit is non-transferable and valid only for the dates specified.", { align: "left" })

      doc.text(
        "4. The permit holder is responsible for their own safety and should follow ranger instructions at all times.",
        { align: "left" },
      )

      doc.moveDown(2)

      // Footer
      const footerY = doc.page.height - 100

      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .text("This is an electronically generated document and does not require a signature.", 50, footerY, {
          align: "center",
        })

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 20, { align: "center" })

      // QR code placeholder (in a real app, you would generate an actual QR code)
      doc.rect(doc.page.width - 150, footerY - 50, 100, 100).stroke()

      doc.fontSize(8).text("QR Verification Code", doc.page.width - 150, footerY + 60, {
        width: 100,
        align: "center",
      })

      // Finalize the PDF
      doc.end()
    } catch (error) {
      console.error("Error in PDF generation:", error)
      reject(error)
    }
  })
}
