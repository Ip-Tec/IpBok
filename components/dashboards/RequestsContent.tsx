"use client";

import { User } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Request {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  requester: {
    name: string;
    email: string;
  };
}

const RequestsContent = ({ user }: { user: User }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        toast.error("Failed to fetch requests");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/requests/${requestId}/${action}`, {
        method: "PATCH",
      });
      if (response.ok) {
        toast.success(`Request ${action}ed successfully`);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.message || `Failed to ${action}`);
      }
    } catch (error) {
      toast.error(`Error ${action}ing request`);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="p-8 bg-background min-h-full">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Pending Requests</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="border-b border-border">
                <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Requester</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Type</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Amount</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Description</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="text-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {req.requester.name} <br />
                      <span className="text-xs text-muted-foreground">
                        {req.requester.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">{req.type.replace("_", " ")}</TableCell>
                    <TableCell className="text-foreground font-semibold">₦{req.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-foreground">{req.description}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold
                            ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                            ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                            ${req.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                        `}>
                            {req.status}
                        </span>
                    </TableCell>
                    <TableCell>
                      {req.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                            onClick={() => handleAction(req.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(req.id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RequestsContent;
