import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireAsnAccessAdmin } from "@/modules/asn/access-api";
import { users } from "@/modules/identity/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const { userId, tenantId } = authorization.session;

    const [user] = await db()
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
      })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        roles: authorization.session.roles,
      },
    });
  } catch (error) {
    console.error("user.me.request_failed", error);
    return NextResponse.json(
      { error: "Gagal memuat profil pengguna." },
      { status: 500 },
    );
  }
}
