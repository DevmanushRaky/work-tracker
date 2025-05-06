"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="flex flex-col items-center gap-6">
        <div className="text-7xl md:text-9xl font-extrabold text-indigo-600 drop-shadow-lg">404</div>
        <div className="text-2xl md:text-3xl font-bold text-gray-800">Page Not Found</div>
        <div className="text-lg text-gray-500 mb-4 text-center max-w-md">
          Oops! The page you are looking for does not exist or has been moved.<br />
          Please check the URL or return to the home page.
        </div>
        <Button asChild size="lg" className="px-8 py-4 text-lg font-semibold shadow-md">
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  );
} 