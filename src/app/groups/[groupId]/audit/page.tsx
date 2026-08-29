import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, User, Clock, FileText } from "lucide-react";

export default async function AuditLogsPage({ params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  await verifyGroupMembership(params.groupId);

  const logs = await prisma.auditLog.findMany({
    where: { groupId: params.groupId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Audit & Operations Log</h1>
        <p className="text-xs text-muted-foreground">Immutable trail of group operations, financial edits, and admin security actions</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-foreground text-base">Activity Timeline ({logs.length})</h3>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No audit records found.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              let metadataObj: any = null;
              try {
                if (log.metadata) metadataObj = JSON.parse(log.metadata);
              } catch (e) {}

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/20 text-xs gap-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-secondary text-muted-foreground font-mono text-[10px] font-bold shrink-0">
                      {log.action}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {log.user.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          performed <strong className="text-purple-300">{log.action}</strong> on {log.entityType}
                        </span>
                      </p>
                      {metadataObj && (
                        <p className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">
                          {JSON.stringify(metadataObj)}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
