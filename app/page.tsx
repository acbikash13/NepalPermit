import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Nepal Protected Areas Permit System
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 mb-10">
          Apply for permits to visit national parks and protected areas in Nepal. Complete the application form to
          receive your permit confirmation.
        </p>
        <p>
            <h2 className="text-xl text-blue-500">
            This application is built by Bishal Acharya. Please reach out if you have any questions.
            </h2>
        </p>
        <div className="mt-10">
          <Link href="/apply">
            <Button size="lg" className="gap-2">
              Fill out the form <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>
            For administrative access, please visit the{" "}
            <Link href="/admin/login" className="text-blue-600 hover:underline">
              admin portal
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
