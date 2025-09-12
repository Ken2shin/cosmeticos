import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id)

    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "ID de pedido inválido" }, { status: 400 })
    }

    const orderResult = await sql`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price,
                 'product_name', p.name,
                 'product_brand', p.brand,
                 'product_image', p.image_url
               ) ORDER BY oi.id
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId}
      GROUP BY o.id
    `

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    return NextResponse.json(orderResult[0])
  } catch (error) {
    console.error("Error fetching order details:", error)
    return NextResponse.json({ error: "Error interno del servidor al obtener detalles del pedido" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id)

    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "ID de pedido inválido" }, { status: 400 })
    }

    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      return NextResponse.json({ error: "Formato de datos inválido" }, { status: 400 })
    }

    const { status } = requestBody

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Estado requerido y debe ser una cadena de texto" }, { status: 400 })
    }

    const validStatuses = ["pending", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Estado inválido. Estados válidos: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const existingOrder = await sql`
      SELECT id, status FROM orders WHERE id = ${orderId}
    `

    if (existingOrder.length === 0) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    const result = await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${orderId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Error al actualizar el pedido" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Estado del pedido actualizado exitosamente",
      order: result[0],
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Error interno del servidor al actualizar el pedido" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id)

    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "ID de pedido inválido" }, { status: 400 })
    }

    console.log("[v0] Starting order deletion for order:", orderId)

    let result;
    await sql`BEGIN`;
    try {
      // Check if order exists within transaction
      const orderExists = await sql`
        SELECT id, status FROM orders WHERE id = ${orderId} FOR UPDATE
      `;

      if (orderExists.length === 0) {
        throw new Error("Pedido no encontrado");
      }

      console.log("[v0] Order exists, proceeding with deletion");

      // Get order items within transaction
      const orderItems = await sql`
        SELECT oi.product_id, oi.quantity, p.name as product_name
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ${orderId}
      `;

      console.log("[v0] Found order items:", orderItems.length);

      // Delete order items first
      const deletedItems = await sql`
        DELETE FROM order_items WHERE order_id = ${orderId}
        RETURNING *
      `;
      console.log("[v0] Deleted", deletedItems.length, "order items");

      // Delete the order
      const deletedOrder = await sql`
        DELETE FROM orders WHERE id = ${orderId} RETURNING *
      `;

      if (deletedOrder.length === 0) {
        throw new Error("Error al eliminar el pedido de la base de datos");
      }

      console.log("[v0] Order deleted successfully:", deletedOrder[0].id);

      result = {
        deleted_order: deletedOrder[0],
        deleted_items: deletedItems.length,
      };

      await sql`COMMIT`;
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }

    return NextResponse.json({
      message: "Pedido eliminado exitosamente sin restaurar stock",
      deleted_order: result.deleted_order,
      deleted_items: result.deleted_items,
    })
  } catch (error) {
    console.error("[v0] Error deleting order:", error)

    let errorMessage = "Error interno del servidor al eliminar el pedido"
    let statusCode = 500

    if (error instanceof Error && error.message.includes("Pedido no encontrado")) {
      errorMessage = "Pedido no encontrado"
      statusCode = 404
    } else if (error instanceof Error && error.message.includes("connection")) {
      errorMessage = "Error de conexión a la base de datos"
    } else if (error instanceof Error && error.message.includes("timeout")) {
      errorMessage = "Tiempo de espera agotado. Intenta de nuevo"
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: statusCode },
    )
  }
}
