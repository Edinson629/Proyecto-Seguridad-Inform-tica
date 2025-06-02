import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const prefix = searchParams.get("prefix")

  if (!prefix || prefix.length !== 5) {
    return NextResponse.json({ error: "Invalid prefix" }, { status: 400 })
  }

  try {
    // Consultar la API de Have I Been Pwned usando k-anonymity
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "User-Agent": "Password-Analyzer-App",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch from HIBP API")
    }

    const data = await response.text()

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600", // Cache por 1 hora
      },
    })
  } catch (error) {
    console.error("Error checking password:", error)
    return NextResponse.json({ error: "Failed to check password" }, { status: 500 })
  }
}
