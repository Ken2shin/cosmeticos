import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { validateDatabaseUrl } from "../../../../../../lib/env-validation"

const sql = neon(validateDatabaseUrl())

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-token")

    if (!token?.value || token.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productData = await request.json()
    const productId = Number.parseInt(params.id)

    console.log("[v0] Updating product:", productId, productData)

    const result = await sql`
      UPDATE products 
      SET name = ${productData.name}, 
          description = ${productData.description}, 
          price = ${productData.price}, 
          currency_code = ${productData.currency_code}, 
          brand = ${productData.brand}, 
          category_id = ${productData.category_id}, 
          stock_quantity = ${productData.stock_quantity}, 
          image_url = ${productData.image_url}, 
          is_active = ${productData.is_active},
          updated_at = NOW()
      WHERE id = ${productId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("[v0] Product updated successfully:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json(
      {
        error: "Failed to update product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-token")

    if (!token?.value || token.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productId = Number.parseInt(params.id)
    console.log("[v0] Deleting product:", productId)

    const result = await sql`
      DELETE FROM products 
      WHERE id = ${productId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("[v0] Product deleted successfully:", result[0])
    return NextResponse.json({ success: true, deleted: result[0] })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json(
      {
        error: "Failed to delete product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
