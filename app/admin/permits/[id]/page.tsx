"use client"
import {use} from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Loader2, Mail, MapPin, Phone, FileText } from "lucide-react"
import { format } from "date-fns"
import { AdminSidebar } from "@/components/admin-sidebar"

interface PermitDetails {
  id: string
  confirmationId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  address: string
  visitPurpose: string
  visitDuration: string
  createdAt: string
  validFrom: string
  validUntil: string
  passportPhotoUrl: string
  idDocumentUrl: string
}

export default function PermitDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [permitDetails, setPermitDetails] = useState<PermitDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth")
        if (!response.ok) {
          router.push("/admin/login")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/admin/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    // Fetch permit details
    const fetchPermitDetails = async () => {
      try {
        const response = await fetch(`/api/admin/permits/${id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch permit details")
        }

        const data = await response.json()
        setPermitDetails(data)
      } catch (error) {
        console.error("Error fetching permit details:", error)
        setError("Failed to load permit details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchPermitDetails()
  }, [id])

  const downloadPermitPdf = async () => {
    if (!permitDetails) return

    try {
      const response = await fetch(`/api/permits/${permitDetails.id}/pdf`)

      if (!response.ok) {
        throw new Error("Failed to download PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `permit-${permitDetails.confirmationId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error("Error downloading PDF:", error)
      setError("Failed to download PDF. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error || !permitDetails) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "An unexpected error occurred."}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Permit Application Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border">
                  <AvatarImage
                    src={permitDetails.passportPhotoUrl}
                    alt={`${permitDetails.firstName} ${permitDetails.lastName}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl">
                    {permitDetails.firstName.charAt(0)}
                    {permitDetails.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{`${permitDetails.firstName} ${permitDetails.lastName}`}</h2>
                <Badge variant="outline" className="mt-1">
                  {permitDetails.country}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{permitDetails.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{permitDetails.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p>{permitDetails.address}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmation Number</p>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {permitDetails.confirmationId}
                  </code>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Submission Date</p>
                  <p>{format(new Date(permitDetails.createdAt), "PPP")}</p>
                </div>
              </div>

              <Button onClick={downloadPermitPdf} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Download Permit PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <Tabs defaultValue="details">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Application Details</CardTitle>
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="details" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Visit Purpose</p>
                      <p className="text-base">{permitDetails.visitPurpose}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Visit Duration</p>
                      <p className="text-base">{permitDetails.visitDuration} days</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Validity Period</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Valid From</p>
                        <p className="text-base">{format(new Date(permitDetails.validFrom), "PPP")}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Valid Until</p>
                        <p className="text-base">{format(new Date(permitDetails.validUntil), "PPP")}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Notes</h3>
                    <p className="text-muted-foreground">No additional notes for this application.</p>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Passport Photo</h3>
                    <div className="border rounded-md p-4 flex justify-center">
                      <img
                        src={permitDetails.passportPhotoUrl || "/placeholder.svg"}
                        alt="Passport Photo"
                        className="max-h-64 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">ID Document</h3>
                    <div className="border rounded-md p-4 flex justify-center">
                      {permitDetails.idDocumentUrl?.toLowerCase().endsWith(".pdf") ? (
                        <div className="flex flex-col items-center">
                          <FileText className="h-16 w-16 text-blue-500 mb-2" />
                          <p className="text-sm text-muted-foreground">PDF Document</p>
                        </div>
                      ) : (
                        <img
                          src={permitDetails.idDocumentUrl || "/placeholder.svg"}
                          alt="ID Document"
                          className="max-h-64 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-4">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Passport Photo
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download ID Document
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
