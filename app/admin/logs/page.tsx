"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ShieldAlert, Clock, User, Info, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/logs");
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized: Access Denied.");
        throw new Error(`Server Error: ${res.statusText}`);
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Activity Logs</h1>
            <p className="text-muted-foreground italic">
              Real-time audit trail of platform events and administrative
              actions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
            />{" "}
            Refresh Feed
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading && logs.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground animate-pulse">
              Scanning Audit Trail...
            </div>
          ) : error ? (
            <div className="p-20 text-center space-y-4">
              <div className="text-destructive font-medium">{error}</div>
              <Button onClick={() => fetchLogs()} variant="outline" size="sm">
                Retry Connection
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground">
              No activity logs found.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-muted/30 transition-colors flex items-start space-x-4"
                >
                  <div
                    className={cn(
                      "p-2 rounded-full mt-1",
                      log.action.includes("ERROR")
                        ? "bg-destructive/10 text-destructive"
                        : log.action.includes("DELETE")
                          ? "bg-destructive/10 text-destructive"
                          : log.action.includes("UPDATE") ||
                              log.action.includes("PRICING")
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-primary/10 text-primary",
                    )}
                  >
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-foreground flex items-center">
                        {log.action.replace(/_/g, " ")}
                      </h4>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(
                          new Date(log.createdAt),
                          "MMM d, yyyy HH:mm:ss",
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center mb-2">
                      <User className="w-3 h-3 mr-1" />{" "}
                      {log.userId || "System/Unknown"}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-auto max-h-40 border border-border">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
