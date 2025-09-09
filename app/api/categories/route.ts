import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const categories = await sql`
      SELECT * FROM categories 
      ORDER BY name ASC
    `
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      await sql`
        INSERT INTO categories (name, description) 
        VALUES 
          ('labial', 'Productos para labios'),
          ('marbellin', 'Productos Marbellin'),
          ('Base', 'Bases y correctores'),
          ('Ojos', 'Productos para ojos'),
          ('Cuidado', 'Productos de cuidado facial')
        ON CONFLICT (name) DO NOTHING
      `

      const categories = await sql`SELECT * FROM categories ORDER BY name ASC`
      return NextResponse.json(categories)
    } catch (fallbackError) {
      console.error("Failed to create categories table:", fallbackError)
      return NextResponse.json(
        [
          { id: 1, name: "labial", description: "Productos para labios" },
          { id: 2, name: "marbellin", description: "Productos Marbellin" },
          { id: 3, name: "Base", description: "Bases y correctores" },
          { id: 4, name: "Ojos", description: "Productos para ojos" },
          { id: 5, name: "Cuidado", description: "Productos de cuidado facial" },
        ],
        { status: 200 },
      )
    }
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json()

    const result = await sql`
      INSERT INTO categories (name, description)
      VALUES (${name}, ${description || ""})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
