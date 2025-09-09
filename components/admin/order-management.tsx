"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, FileText, Package, User, Calendar, DollarSign } from "lucide-react"

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  total_amount: number
  status: string
  created_at: string
  items?: OrderItem[]
}

interface OrderItem {
  id: number
  product_name: string
  product_brand?: string
  quantity: number
  unit_price: number
  total_price: number
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders")
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderDetails = await response.json()
        setSelectedOrder(orderDetails)
        setShowDetails(true)
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
    }
  }

  const generateInvoice = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`)
      if (response.ok) {
        const blob = await response.blob()
        if (typeof window !== "undefined") {
          const url = window.URL.createObjectURL(blob)
          window.open(url, "_blank")
        }
      }
    } catch (error) {
      console.error("Error generating invoice:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "completed":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                  <p className="text-muted-foreground">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                </div>
                <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-primary">${order.total_amount}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchOrderDetails(order.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => generateInvoice(order.id)}>
                    <FileText className="w-4 h-4 mr-1" />
                    Factura
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalles del Pedido #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>Nombre:</strong> {selectedOrder.customer_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.customer_email}
                    </p>
                    {selectedOrder.customer_phone && (
                      <p>
                        <strong>Teléfono:</strong> {selectedOrder.customer_phone}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Información del Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>Fecha:</strong> {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Estado:</strong>
                      <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                    </p>
                    <p className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <strong>Total:</strong> ${selectedOrder.total_amount}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Productos del Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Producto</th>
                            <th className="text-left p-2">Marca</th>
                            <th className="text-center p-2">Cantidad</th>
                            <th className="text-right p-2">Precio Unit.</th>
                            <th className="text-right p-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items
                            .filter((item) => item.product_name)
                            .map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-2">{item.product_name}</td>
                                <td className="p-2">{item.product_brand || "-"}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">${item.unit_price}</td>
                                <td className="p-2 text-right font-semibold">${item.total_price}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => generateInvoice(selectedOrder.id)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Factura
                </Button>
                <Button onClick={() => setShowDetails(false)}>Cerrar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
