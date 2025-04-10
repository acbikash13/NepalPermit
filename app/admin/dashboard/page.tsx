"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  LogOut,
  MoreHorizontal,
  Search,
  Users,
  Calendar,
  Download,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Permit {
  id: string
  confirmationId: string
  firstName: string
  lastName: string
  email: string
  country: string
  createdAt: string
  passportPhotoUrl: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [permits, setPermits] = useState<Permit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPermits, setFilteredPermits] = useState<Permit[]>([])
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
    // Fetch permits data
    const fetchPermits = async () => {
      try {
        setError(null)
        const response = await fetch("/api/admin/permits")

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error response:", response.status, errorData)
          throw new Error(errorData.error || `Server responded with ${response.status}`)
        }

        const data = await response.json()
        setPermits(data)
        setFilteredPermits(data)
      } catch (error) {
        console.error("Error fetching permits:", error)
        setError(`Failed to fetch permits: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPermits()
  }, [])

  useEffect(() => {
    // Filter permits based on search query
    if (searchQuery.trim() === "") {
      setFilteredPermits(permits)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = permits.filter(
        (permit) =>
          permit.firstName?.toLowerCase().includes(query) ||
          permit.lastName?.toLowerCase().includes(query) ||
          permit.email?.toLowerCase().includes(query) ||
          permit.confirmationId?.toLowerCase().includes(query) ||
          permit.country?.toLowerCase().includes(query),
      )
      setFilteredPermits(filtered)
    }
  }, [searchQuery, permits])

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const viewPermitDetails = (id: string) => {
    router.push(`/admin/permits/${id}`)
  }

  const downloadPermitPdf = async (id: string) => {
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
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permits.length}</div>
              <p className="text-xs text-muted-foreground">All time permit applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {permits.filter((p) => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </div>
              <p className="text-xs text-muted-foreground">Applications in the last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Applications</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {permits.filter((p) => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <p className="text-xs text-muted-foreground">Applications in the last 7 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Applications</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Date Submitted</TableHead>
                      <TableHead>Confirmation #</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No permit applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPermits.map((permit) => (
                        <TableRow key={permit.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border">
                                <AvatarImage
                                  src={permit.passportPhotoUrl}
                                  alt={`${permit.firstName} ${permit.lastName}`}
                                  className="object-cover"
                                />
                                <AvatarFallback>
                                  {permit.firstName?.charAt(0) || "?"}
                                  {permit.lastName?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{`${permit.firstName || ""} ${permit.lastName || ""}`}</p>
                                <p className="text-sm text-muted-foreground">{permit.email || "No email"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{permit.country || "Unknown"}</TableCell>
                          <TableCell>{format(new Date(permit.createdAt), "PPP")}</TableCell>
                          <TableCell>
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                              {permit.confirmationId}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => viewPermitDetails(permit.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadPermitPdf(permit.id)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  <span>Download PDF</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Date Submitted</TableHead>
                      <TableHead>Confirmation #</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermits.filter(
                      (p) => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No recent permit applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPermits
                        .filter((p) => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                        .map((permit) => (
                          <TableRow key={permit.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border">
                                  <AvatarImage
                                    src={permit.passportPhotoUrl}
                                    alt={`${permit.firstName} ${permit.lastName}`}
                                    className="object-cover"
                                  />
                                  <AvatarFallback>
                                    {permit.firstName?.charAt(0) || "?"}
                                    {permit.lastName?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{`${permit.firstName || ""} ${permit.lastName || ""}`}</p>
                                  <p className="text-sm text-muted-foreground">{permit.email || "No email"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{permit.country || "Unknown"}</TableCell>
                            <TableCell>{format(new Date(permit.createdAt), "PPP")}</TableCell>
                            <TableCell>
                              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                {permit.confirmationId}
                              </code>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => viewPermitDetails(permit.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>View Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => downloadPermitPdf(permit.id)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Download PDF</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Pending applications view will be implemented in the next phase.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
