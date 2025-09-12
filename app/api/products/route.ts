import { NextResponse } from "next/server"

const mockProducts = [
  {
    id: 1,
    name: "Labial Mate Rojo",
    description: "Labial de larga duración con acabado mate",
    price: 25.99,
    category_id: 1,
    category_name: "labial",
    brand: "Beauty Pro",
    image_url: "/red-matte-lipstick.jpg",
    stock_quantity: 15,
    sku: "LAB001",
    is_active: true,
    currency_code: "USD",
    stock_status: "in_stock",
    is_available: true,
    stock_level: 15,
    min_stock: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Base Líquida Natural",
    description: "Base de cobertura media con acabado natural",
    price: 35.5,
    category_id: 3,
    category_name: "Base",
    brand: "Marbellin",
    image_url: "/liquid-foundation-bottle.jpg",
    stock_quantity: 8,
    sku: "BAS002",
    is_active: true,
    currency_code: "USD",
    stock_status: "in_stock",
    is_available: true,
    stock_level: 8,
    min_stock: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Sombra Paleta Neutral",
    description: "Paleta de sombras con tonos neutros para uso diario",
    price: 42.0,
    category_id: 4,
    category_name: "Ojos",
    brand: "Beauty Pro",
    image_url: "/neutral-eyeshadow-palette.jpg",
    stock_quantity: 3,
    sku: "OJO003",
    is_active: true,
    currency_code: "USD",
    stock_status: "low_stock",
    is_available: true,
    stock_level: 3,
    min_stock: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Serum Hidratante",
    description: "Serum facial con ácido hialurónico para hidratación profunda",
    price: 28.75,
    category_id: 5,
    category_name: "Cuidado",
    brand: "Marbellin",
    image_url: "/facial-serum-bottle.jpg",
    stock_quantity: 0,
    sku: "CUI004",
    is_active: true,
    currency_code: "USD",
    stock_status: "out_of_stock",
    is_available: false,
    stock_level: 0,
    min_stock: 5,
    created_at: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    console.log("[v0] Returning mock products data")
    return NextResponse.json(mockProducts)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(mockProducts)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, category, brand, image_url, stock_quantity, sku, currency_code } = body

    let finalSKU = sku
    if (!finalSKU || finalSKU.trim() === "") {
      const prefix = name.substring(0, 3).toUpperCase()
      const timestamp = Date.now().toString().slice(-6)
      const randomNum = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0")
      finalSKU = `${prefix}${timestamp}${randomNum}`
    }

    const newProduct = {
      id: mockProducts.length + 1,
      name,
      description,
      price,
      category_id: 1, // Default category
      category_name: category || "General",
      brand: brand || "",
      image_url: image_url || "/beauty-product-display.png",
      stock_quantity: stock_quantity || 0,
      sku: finalSKU,
      is_active: true,
      currency_code: currency_code || "USD",
      stock_status: (stock_quantity || 0) <= 0 ? "out_of_stock" : (stock_quantity || 0) <= 5 ? "low_stock" : "in_stock",
      is_available: (stock_quantity || 0) > 0,
      stock_level: stock_quantity || 0,
      min_stock: 5,
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Mock product created:", newProduct)
    return NextResponse.json(newProduct)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
