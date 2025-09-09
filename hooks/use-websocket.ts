"use client"

import { useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useWebSocket(userType: "admin" | "client" = "client") {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Conectar al WebSocket
    socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || window.location.origin)

    const socket = socketRef.current

    // Unirse a la sala correspondiente
    socket.emit(`join-${userType}`)

    // Listeners para notificaciones
    if (userType === "admin") {
      socket.on("new-order", (data) => {
        showNotification("Nuevo Pedido", `${data.customerName} realizó un pedido por ${data.total}`, "/admin")
      })
    } else {
      socket.on("order-confirmed", (data) => {
        showNotification("Pedido Confirmado", `Tu pedido #${data.orderId} ha sido confirmado`, "/")
      })

      socket.on("new-product", (data) => {
        showNotification("Nuevo Producto", `${data.name} ahora disponible`, "/")
      })
    }

    return () => {
      socket.disconnect()
    }
  }, [userType])

  return socketRef.current
}

function showNotification(title: string, body: string, url: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = url
      notification.close()
    }
  }
}
