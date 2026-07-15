import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json(
      {
        status: "ok",
        service: "maskapai-web",
        node: process.env.APP_NODE_NAME ?? "unknown",
        database: "up",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Healthcheck PostgreSQL gagal:", error);

    return Response.json(
      {
        status: "error",
        service: "maskapai-web",
        node: process.env.APP_NODE_NAME ?? "unknown",
        database: "down",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
