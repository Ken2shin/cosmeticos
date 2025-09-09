import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    // Get order details with items
    const orderResult = await sql`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'product_name', p.name,
                 'product_brand', p.brand,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price
               ) ORDER BY oi.id
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId}
      GROUP BY o.id
    `

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orderResult[0]

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml(order)

    return new NextResponse(invoiceHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="factura-${orderId}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}

function generateInvoiceHtml(order: any) {
  const items = order.items.filter((item: any) => item.product_name !== null)
  const subtotal = items.reduce((sum: number, item: any) => sum + Number.parseFloat(item.total_price), 0)
  const tax = subtotal * 0.15 // 15% tax
  const total = subtotal + tax

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factura #${order.id} - Beauty Catalog</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #e91e63; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #e91e63; }
        .invoice-info { text-align: right; }
        .customer-info { margin-bottom: 30px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #f8f9fa; font-weight: bold; }
        .totals { text-align: right; }
        .totals div { margin: 5px 0; }
        .total-final { font-size: 18px; font-weight: bold; color: #e91e63; border-top: 2px solid #e91e63; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        @media print { body { background: white; } .invoice { box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="logo">🌸 Beauty Catalog</div>
          <div class="invoice-info">
            <h2>FACTURA</h2>
            <p><strong>Número:</strong> #${order.id}</p>
            <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleDateString("es-ES")}</p>
            <p><strong>Estado:</strong> ${order.status === "pending" ? "Pendiente" : order.status === "completed" ? "Completado" : "Cancelado"}</p>
          </div>
        </div>

        <div class="customer-info">
          <h3>Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${order.customer_name}</p>
          <p><strong>Email:</strong> ${order.customer_email}</p>
          ${order.customer_phone ? `<p><strong>Teléfono:</strong> ${order.customer_phone}</p>` : ""}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Marca</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item: any) => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.product_brand || "-"}</td>
                <td>${item.quantity}</td>
                <td>$${Number.parseFloat(item.unit_price).toFixed(2)}</td>
                <td>$${Number.parseFloat(item.total_price).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: $${subtotal.toFixed(2)}</div>
          <div>Impuestos (15%): $${tax.toFixed(2)}</div>
          <div class="total-final">Total: $${total.toFixed(2)}</div>
        </div>

        <div class="footer">
          <p>Gracias por su compra en Beauty Catalog</p>
          <p>Para consultas, contacte a: info@beautycatalog.com</p>
        </div>
      </div>

      <script>
        if (typeof window !== "undefined") {
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          }
        }
      </script>
    </body>
    </html>
  `
}
