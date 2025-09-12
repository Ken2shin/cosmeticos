"use client"

import { useEffect } from "react"
import { useWebSocket } from "@/hooks/use-websocket"

export function AdminWebSocket() {
  const socket = useWebSocket("admin")

  useEffect(() => {
    if (!socket) return

    // Listener para nuevos pedidos
    socket.on("new-order", (data) => {
      console.log("[v0] Nuevo pedido recibido:", data)

      // Mostrar notificación del navegador
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("🛍️ Nuevo Pedido Recibido", {
          body: `${data.customerName} (${data.customerPhone})\nTotal: C$${data.total}`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "new-order",
          requireInteraction: true,
          // Note: The 'actions' property is not supported in the standard Notification API
          // and has been removed to avoid type errors.
        })

        notification.onclick = () => {
          if (typeof window !== "undefined") {
            window.focus()
          }
          // Navegar a la sección de pedidos
          const ordersTab = document.querySelector('[value="orders"]') as HTMLElement
          if (ordersTab) ordersTab.click()
          notification.close()
        }

        // Auto cerrar después de 10 segundos
        setTimeout(() => notification.close(), 10000)
      }

      // Mostrar notificación en la página también
      showInPageNotification(`🛍️ Nuevo pedido de ${data.customerName} por C$${data.total}`, "order")

      // Reproducir sonido de notificación
      playNotificationSound()
    })

    return () => {
      socket.off("new-order")
    }
  }, [socket])

  return null
}

function showInPageNotification(message: string, type: "order" | "info" = "info") {
  // Crear elemento de notificación en la página
  const notification = document.createElement("div")
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full max-w-sm ${
    type === "order"
      ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white border-l-4 border-yellow-400"
      : "bg-blue-500 text-white"
  }`

  notification.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 text-2xl">🛍️</div>
      <div class="flex-1">
        <div class="font-semibold text-sm">Nuevo Pedido</div>
        <div class="text-xs opacity-90 mt-1">${message}</div>
      </div>
      <button class="flex-shrink-0 text-white/80 hover:text-white text-lg leading-none" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `

  document.body.appendChild(notification)

  // Animar entrada
  setTimeout(() => {
    notification.classList.remove("translate-x-full")
  }, 100)

  // Auto remover después de 8 segundos
  setTimeout(() => {
    notification.classList.add("translate-x-full")
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 8000)
}

function playNotificationSound() {
  if (typeof window === "undefined") return

  // Crear y reproducir sonido de notificación
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)
}
