import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const response = await fetch(
      `${process.env.API_URL || "http://localhost:3000"}/api/store-settings`,
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
        { message: data.message || "Erro ao obter configurações da loja" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar configurações da loja:", error);
    return NextResponse.json(
      { message: "Erro ao buscar configurações da loja" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    if (!token) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const response = await fetch(
      `${process.env.API_URL || "http://localhost:3000"}/api/store-settings`,
      {
        method: "PUT",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Erro ao atualizar configurações da loja" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao atualizar configurações da loja:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar configurações da loja" },
      { status: 500 }
    );
  }
}
