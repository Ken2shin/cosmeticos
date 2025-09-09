import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { subscription, userType } = await request.json()

    const { endpoint, keys } = subscription
    const { p256dh, auth } = keys

    // Insertar o actualizar suscripción
    await sql`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_type)
      VALUES (${endpoint}, ${p256dh}, ${auth}, ${userType})
      ON CONFLICT (endpoint) 
      DO UPDATE SET 
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_type = EXCLUDED.user_type,
        created_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error subscribing to push notifications:", error)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}
