"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductManagement } from "@/components/admin/product-management"
import { OrderManagement } from "@/components/admin/order-management"
import { DashboardStats } from "@/components/admin/dashboard-stats"

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <DashboardStats />

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            Productos
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            Pedidos
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            Análisis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-500">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-500">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-500">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-muted-foreground text-lg">Análisis y reportes próximamente...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
