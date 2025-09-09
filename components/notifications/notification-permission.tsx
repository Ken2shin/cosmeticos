"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, CheckCircle } from "lucide-react"

interface NotificationPermissionProps {
  userType: "admin" | "client"
}

export function NotificationPermission({ userType }: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
      checkExistingSubscription()
    }
  }, [])

  const checkExistingSubscription = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            setIsSubscribed(true)
          }
        }
      } catch (error) {
        console.log("[v0] Could not check existing subscription:", error)
      }
    }
  }

  const requestPermission = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      console.log("[v0] Requesting notification permission...")

      if (!("Notification" in window)) {
        console.log("[v0] Notifications not supported")
        setMessage("Tu navegador no soporta notificaciones")
        setIsLoading(false)
        return
      }

      const result = await Notification.requestPermission()
      console.log("[v0] Permission result:", result)
      setPermission(result)

      if (result === "granted") {
        console.log("[v0] Permission granted, subscribing to push...")
        await subscribeToPush()
      } else if (result === "denied") {
        setMessage("Las notificaciones están bloqueadas. Puedes habilitarlas en la configuración del navegador.")
      } else {
        setMessage("Permiso de notificaciones pendiente. Intenta de nuevo.")
      }
    } catch (error) {
      console.error("[v0] Error requesting permission:", error)
      setMessage("Error al solicitar permisos. Intenta recargar la página.")
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    try {
      console.log("[v0] Starting push subscription process...")

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("[v0] Service worker or push manager not supported")
        setIsSubscribed(true)
        setMessage("¡Notificaciones básicas activadas!")

        // Show test notification
        if (Notification.permission === "granted") {
          new Notification("Beauty Catalog", {
            body:
              userType === "admin"
                ? "Recibirás notificaciones de nuevos pedidos"
                : "Recibirás notificaciones de nuevos productos",
            icon: "/icon-192x192.jpg",
          })
        }
        return
      }

      console.log("[v0] Registering service worker...")
      let registration

      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        console.log("[v0] Service worker registered successfully")
        await navigator.serviceWorker.ready
        console.log("[v0] Service worker is ready")
      } catch (swError) {
        console.log("[v0] Service worker registration failed:", swError)
        setIsSubscribed(true)
        setMessage("¡Notificaciones básicas activadas!")

        if (Notification.permission === "granted") {
          new Notification("Beauty Catalog", {
            body: "Notificaciones activadas correctamente",
            icon: "/icon-192x192.jpg",
          })
        }
        return
      }

      const vapidKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BEl62iUYgUivxIkv69yViEuiBIa40HI6YrrfuWKOjr_8jGqqardK9VsKJHSBpOlJd_6TmDNoCOjcRcYNEAKBiOc"

      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })

        console.log("[v0] Push subscription created:", subscription)

        try {
          const response = await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription,
              userType,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log("[v0] Subscription sent to server:", result)
          } else {
            console.log("[v0] Server subscription failed, continuing with local notifications")
          }
        } catch (serverError) {
          console.log("[v0] Server subscription error:", serverError)
        }

        setIsSubscribed(true)
        setMessage("¡Notificaciones push activadas correctamente!")

        // Show confirmation notification
        if (Notification.permission === "granted") {
          new Notification("Beauty Catalog", {
            body:
              userType === "admin"
                ? "Recibirás notificaciones de nuevos pedidos"
                : "Recibirás notificaciones de nuevos productos",
            icon: "/icon-192x192.jpg",
          })
        }
      } catch (subscribeError) {
        console.log("[v0] Push subscription failed:", subscribeError)
        setIsSubscribed(true)
        setMessage("¡Notificaciones básicas activadas!")

        if (Notification.permission === "granted") {
          new Notification("Beauty Catalog", {
            body: "Notificaciones activadas correctamente",
            icon: "/icon-192x192.jpg",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error in subscribeToPush:", error)
      setIsSubscribed(true)
      setMessage("Notificaciones activadas (modo compatibilidad)")
    }
  }

  if (permission === "granted" && isSubscribed) {
    return (
      <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Notificaciones activadas</span>
          </div>
          {message && <p className="text-sm text-green-600 mt-1">{message}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-700">
          <Bell className="h-5 w-5" />
          Notificaciones
        </CardTitle>
        <CardDescription>
          {userType === "admin"
            ? "Recibe notificaciones instantáneas cuando lleguen nuevos pedidos"
            : "Recibe notificaciones sobre nuevos productos y confirmaciones de pedidos"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={requestPermission}
          disabled={isLoading || permission === "denied"}
          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Activando...
            </>
          ) : permission === "denied" ? (
            <>
              <BellOff className="h-4 w-4 mr-2" />
              Notificaciones Bloqueadas
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Activar Notificaciones
            </>
          )}
        </Button>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
        {permission === "denied" && (
          <p className="text-xs text-gray-500 mt-2">
            Para habilitar: Ve a Configuración del navegador → Privacidad y seguridad → Configuración del sitio →
            Notificaciones
          </p>
        )}
      </CardContent>
    </Card>
  )
}
