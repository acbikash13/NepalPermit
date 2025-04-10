"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Download, FileText, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface PermitData {
  confirmationId: string
  firstName: string
  lastName: string
  email: string
  country: string
  createdAt: string
  validFrom: string
  validUntil: string
}

// ⬇️ Update here: unwrap the params using React.use()
export default function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) // ✅ This resolves the warning

  const [loading, setLoading] = useState(true)
  const [permitData, setPermitData] = useState<PermitData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPermitData() {
      try {
        const response = await fetch(`/api/permits/${id}`)

        if (!response.ok) {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch permit data")
          } else {
            const textResponse = await response.text()
            console.error("Non-JSON response:", textResponse)
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }
        }

        const data = await response.json()
        setPermitData(data)
      } catch (err) {
        console.error("Error fetching permit data:", err)
        setError("Unable to load your permit information. Please contact support.")
      } finally {
        setLoading(false)
      }
    }

    fetchPermitData()
  }, [id])

  const downloadPdf = async () => {
    try {
      const response = await fetch(`/api/permits/${id}/pdf`)

      if (!response.ok) {
        throw new Error("Failed to download PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `permit-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      console.error("Error downloading PDF:", err)
      setError("Failed to download PDF. Please try again later.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error || !permitData) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "An unexpected error occurred."}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Permit Application Confirmation</CardTitle>
          <CardDescription>Your application has been successfully submitted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md border border-green-200 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Application Submitted Successfully</span>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="font-semibold text-lg mb-4">Confirmation Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Confirmation Number</p>
                <p className="font-medium">{permitData.confirmationId}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Submission Date</p>
                <p className="font-medium">{format(new Date(permitData.createdAt), "PPP")}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{`${permitData.firstName} ${permitData.lastName}`}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{permitData.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p className="font-medium">{permitData.country}</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-blue-50">
            <h3 className="font-semibold text-lg mb-4">Validity Period</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Valid From</p>
                <p className="font-medium">{format(new Date(permitData.validFrom), "PPP")}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="font-medium">{format(new Date(permitData.validUntil), "PPP")}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <p className="text-sm">
              Please download and print your permit confirmation. You will need to present this document along with your
              ID when visiting the protected area.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button onClick={downloadPdf} className="w-full sm:w-auto gap-2">
            <Download className="h-4 w-4" />
            Download Permit PDF
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full sm:w-auto">
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
