import {
  accessApiError,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import { parseAsnPerformanceRequest } from "@/modules/asn/performance-api";
import { exportAsnPerformance } from "@/modules/asn/performance-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const { filters, format } = parseAsnPerformanceRequest(
      new URL(request.url).searchParams,
    );
    const result = await exportAsnPerformance(
      authorization.session.tenantId,
      filters,
      format,
    );

    return new Response(result.body, {
      status: 200,
      headers: {
        "content-type": result.contentType,
        "content-disposition": `attachment; filename="asn-performance.${format}"`,
      },
    });
  } catch (error) {
    return accessApiError(error);
  }
}
