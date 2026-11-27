import { getCheckReport } from "@/lib/check-reports";
import { getSessionUser } from "@/lib/session";

export async function GET(_request: Request, { params }: RouteContext<"/api/checks/[id]">) {
  const { id } = await params;
  const user = await getSessionUser();
  const report = await getCheckReport(id, true, user?.id);
  const headers = { "Cache-Control": "private, no-store" };
  return report
    ? Response.json(report, { headers })
    : Response.json({ error: "Check not found." }, { status: 404, headers });
}
