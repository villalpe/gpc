import { backendGet } from "@/lib/backend-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const { labelId } = await params;
  if (!/^\d+$/.test(labelId)) {
    return Response.json({ detail: "La etiqueta indicada no es válida." }, { status: 400 });
  }

  try {
    const upstream = await backendGet(
      `/integrations/fedex/shipments/labels/${labelId}/`
    );
    const contentDisposition = upstream.headers.get("content-disposition");
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        ...(contentDisposition ? { "Content-Disposition": contentDisposition } : {}),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/fedex/shipments/labels error:", error);
    return Response.json(
      { detail: "No se pudo descargar la etiqueta FedEx." },
      { status: 500 }
    );
  }
}
