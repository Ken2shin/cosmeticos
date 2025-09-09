"use client"

import { useState } from "react"
import { ProductGrid } from "@/components/product-grid"
import { CategoryFilter } from "@/components/category-filter"

export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Nuestros Productos</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descubre nuestra amplia gama de productos de belleza cuidadosamente seleccionados para ti.
        </p>
      </div>

      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      <ProductGrid selectedCategory={selectedCategory} />
    </div>
  )
}
