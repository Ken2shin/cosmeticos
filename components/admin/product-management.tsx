"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import type { Product } from "@/types/product"
import { ProductForm } from "@/components/admin/product-form"

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false) // Add loading state during deletion

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      console.log("[v0] Fetching products from client API")
      const response = await fetch("/api/products")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Products fetched successfully:", data.length)
      setProducts(data)
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (productId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      setDeleteLoading(true) // Add loading state during deletion
      try {
        const response = await fetch(`/api/products/${productId}`, { method: "DELETE" })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`)
        }

        alert("Producto eliminado exitosamente")
        await fetchProducts()
      } catch (error) {
        console.error("[v0] Error deleting product:", error)
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar el producto"
        alert(`Error al eliminar el producto: ${errorMessage}`)
      } finally {
        setDeleteLoading(false) // Add loading state during deletion
      }
    }
  }

  const toggleProductStatus = async (productId: number, currentStatus: boolean) => {
    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          is_active: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      alert(`Producto ${!currentStatus ? "activado" : "desactivado"} exitosamente`)
      fetchProducts()
    } catch (error) {
      console.error("[v0] Error toggling product status:", error)
      alert("Error al cambiar el estado del producto")
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingProduct(null)
    fetchProducts()
  }

  if (showForm) {
    return <ProductForm product={editingProduct} onClose={handleFormClose} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
          Gestión de Productos
        </h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {loading || deleteLoading ? ( // Add loading state during deletion
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {product.name}
                  </CardTitle>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
              </CardHeader>
              <CardContent>
                {product.image_url && (
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-rose-600">
                    {product.currency_code === "USD" ? "$" : "C$"}
                    {product.price}
                  </span>
                  <span className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProductStatus(product.id, product.is_active)}
                    className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="text-destructive hover:text-destructive hover:bg-red-50 hover:border-red-300 transition-colors"
                    disabled={deleteLoading} // Disable button during deletion
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Plus className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground mb-4">Comienza agregando tu primer producto</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Producto
          </Button>
        </div>
      )}
    </div>
  )
}
