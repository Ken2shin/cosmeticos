"use client"

import { useEffect } from "react"
import { useWebSocket } from "@/hooks/use-websocket"

export function ClientWebSocket() {
  const socket = useWebSocket("client")

  useEffect(() => {
    if (!socket) return

    // Listener para nuevos productos
    socket.on("new-product", (data) => {
      console.log("[v0] Nuevo producto recibido:", data)

      // Mostrar notificación del navegador
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("🆕 Nuevo Producto Disponible", {
          body: `${data.name} - ${data.currency === "USD" ? "$" : "C$"}${data.price}`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "new-product",
          requireInteraction: true,
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // Auto cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000)
      }

      // Mostrar notificación en la página también
      showInPageNotification(`🆕 ${data.name} ahora disponible`, "success")
    })

    // Listener para confirmación de pedidos
    socket.on("order-confirmed", (data) => {
      console.log("[v0] Pedido confirmado:", data)

      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("✅ Pedido Confirmado", {
          body: `Tu pedido #${data.orderId} ha sido confirmado`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "order-confirmed",
          requireInteraction: true,
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        setTimeout(() => notification.close(), 7000)
      }

      showInPageNotification(`✅ Pedido #${data.orderId} confirmado`, "success")
    })

    return () => {
      socket.off("new-product")
      socket.off("order-confirmed")
    }
  }, [socket])

  return null
}

function showInPageNotification(message: string, type: "success" | "info" = "info") {
  // Crear elemento de notificación en la página
  const notification = document.createElement("div")
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${
    type === "success" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
  }`
  notification.textContent = message

  document.body.appendChild(notification)

  // Animar entrada
  setTimeout(() => {
    notification.classList.remove("translate-x-full")
  }, 100)

  // Auto remover después de 4 segundos
  setTimeout(() => {
    notification.classList.add("translate-x-full")
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 4000)
}
