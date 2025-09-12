import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const products = await sql`
      SELECT 
        p.*,
        c.name as category_name,
        CASE 
          WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= 5 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `

    const formattedProducts = products.map((product) => ({
      ...product,
      brand: product.brand || "",
      is_available: product.stock_quantity > 0,
      stock_level: product.stock_quantity || 0,
      min_stock: 5,
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, category, brand, image_url, stock_quantity, sku, currency_code } = body

    let categoryId = null
    if (category) {
      try {
        const existingCategory = await sql`
          SELECT id FROM categories WHERE LOWER(name) = LOWER(${category})
        `

        if (existingCategory.length > 0) {
          categoryId = existingCategory[0].id
        } else {
          const newCategory = await sql`
            INSERT INTO categories (name) VALUES (${category}) RETURNING id
          `
          categoryId = newCategory[0].id
        }
      } catch (error) {
        console.log("[v0] Category handling failed, continuing without category")
      }
    }

    let finalSKU = sku
    if (!finalSKU || finalSKU.trim() === "") {
      const prefix = name.substring(0, 3).toUpperCase()
      const timestamp = Date.now().toString().slice(-6)
      const randomNum = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0")
      finalSKU = `${prefix}${timestamp}${randomNum}`
    }

    try {
      const existingSKU = await sql`
        SELECT id FROM products WHERE sku = ${finalSKU}
      `

      if (existingSKU.length > 0) {
        finalSKU = `${finalSKU}-${Math.floor(Math.random() * 1000)}`
      }
    } catch (error) {
      console.log("[v0] SKU check failed, using generated SKU")
    }

    const result = await sql`
      INSERT INTO products (
        name, 
        description, 
        price, 
        category_id, 
        brand, 
        image_url, 
        stock_quantity, 
        sku,
        is_active,
        currency_code
      )
      VALUES (
        ${name}, 
        ${description}, 
        ${price}, 
        ${categoryId}, 
        ${brand || ""}, 
        ${image_url || ""}, 
        ${stock_quantity || 0}, 
        ${finalSKU},
        ${true},
        ${currency_code || "USD"}
      )
      RETURNING *
    `

    console.log("[v0] Product created successfully:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
