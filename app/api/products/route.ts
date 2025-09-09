import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const products = await sql`
      SELECT 
        id,
        name,
        description,
        price,
        category,
        image_url,
        stock_quantity,
        created_at
      FROM products 
      ORDER BY created_at DESC
    `

    const formattedProducts = products.map((product) => ({
      ...product,
      brand: product.brand || "",
      is_active: product.is_active !== false, // Default to true if not set
      updated_at: product.updated_at || product.created_at,
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error("Error fetching products:", error)

    try {
      const fallbackProducts = await sql`SELECT * FROM products`
      return NextResponse.json(fallbackProducts || [])
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError)
      return NextResponse.json([], { status: 200 })
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, category, brand, image_url, stock_quantity, is_active } = body

    const result = await sql`
      INSERT INTO products (name, description, price, category, brand, image_url, stock_quantity, is_active)
      VALUES (${name}, ${description}, ${price}, ${category}, ${brand}, ${image_url}, ${stock_quantity}, ${is_active})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
