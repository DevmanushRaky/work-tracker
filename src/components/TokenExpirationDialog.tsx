"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function TokenExpirationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        localStorage.removeItem("token")
        router.replace("/")
      }
    }

    // Check token on mount
    checkToken()

    // Set up interval to check token periodically
    const interval = setInterval(checkToken, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [router])

  const handleLogin = () => {
    setIsOpen(false)
    router.push("/")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
          <DialogDescription>
            Your session has expired due to inactivity. Please log in again to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button onClick={handleLogin}>
            Go to Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 