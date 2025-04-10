"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { countries } from "@/lib/countries"
import { FileUploader } from "@/components/file-uploader"

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(5, {
    message: "Please enter a valid phone number.",
  }),
  country: z.string({
    required_error: "Please select a country.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  visitPurpose: z.string().min(10, {
    message: "Please provide more details about your visit purpose.",
  }),
  visitDuration: z.string().min(1, {
    message: "Please specify your visit duration.",
  }),
})

export default function ApplyPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null)
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      address: "",
      visitPurpose: "",
      visitDuration: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Reset any previous errors
    setError(null)

    if (!passportPhoto || !idDocument) {
      toast({
        title: "Missing files",
        description: "Please upload both a passport photo and an ID document.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      // Add form values
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value)
      })

      // Add files
      formData.append("passportPhoto", passportPhoto)
      formData.append("idDocument", idDocument)

      console.log("Submitting form data...")

      const response = await fetch("/api/permits", {
        method: "POST",
        body: formData,
      })

      // Check if the response is JSON
      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // Handle non-JSON response
        const textResponse = await response.text()
        console.error("Non-JSON response:", textResponse)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application")
      }

      console.log("Form submission successful:", data)

      // Redirect to confirmation page with the confirmation ID
      router.push(`/confirmation/${data.confirmationId}`)
    } catch (error) {
      console.error("Error submitting form:", error)
      setError(error.message || "There was a problem submitting your application. Please try again.")
      toast({
        title: "Error",
        description: error.message || "There was a problem submitting your application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Permit Application Form</CardTitle>
          <CardDescription>Fill out this form to apply for a permit to visit protected areas in Nepal.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Visit</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the purpose of your visit to the protected area."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Duration (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="7" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="font-medium text-sm">Passport-size Photo</div>
                  <FileUploader
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    onFileSelect={setPassportPhoto}
                    label="Upload passport photo"
                  />
                  <p className="text-sm text-muted-foreground">Please upload a recent passport-size photo (max 5MB).</p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-sm">ID Document</div>
                  <FileUploader
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={10 * 1024 * 1024} // 10MB
                    onFileSelect={setIdDocument}
                    label="Upload ID document"
                  />
                  <p className="text-sm text-muted-foreground">
                    Please upload a scan of your passport or other ID (max 10MB).
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
