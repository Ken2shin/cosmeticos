"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log("[v0] Checking authentication status")
      const response = await fetch("/api/auth/check")
      const isAuth = response.ok
      console.log("[v0] Authentication check result:", isAuth)
      setIsAuthenticated(isAuth)
      setIsAdmin(isAuth)

      if (!isAuth && window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
        console.log("[v0] Not authenticated, redirecting to login")
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login"
        }
        return
      }
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      setIsAuthenticated(false)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log("[v0] Logging out")
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAuthenticated(false)
      setIsAdmin(false)
      document.cookie = "admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login"
      }
    } catch (error) {
      console.error("[v0] Logout error:", error)
      setIsAuthenticated(false)
      setIsAdmin(false)
      document.cookie = "admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login"
      }
    }
  }

  if (isLoading && typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50/50 to-pink-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, isAdmin, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
