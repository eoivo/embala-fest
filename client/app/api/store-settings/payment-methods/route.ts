import { NextRequest, NextResponse } from "next/server";

// URL do servidor backend
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://embala-fest-api.onrender.com"
    : "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/store-settings/payment-methods`,
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Erro ao obter métodos de pagamento" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar métodos de pagamento:", error);
    return NextResponse.json(
      { message: "Erro ao buscar métodos de pagamento" },
      { status: 500 }
    );
  }
}
