"use client";
import React, { useState, useEffect } from "react";
import { UserPlus, User, Search, Trash2, Pencil, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { AddAgentDialog } from "./AddAgentDialog";
import { EditAgentDialog } from "./EditAgentDialog";
import { GiveCashDialog } from "./GiveCashDialog";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  status: string;
  dailyTransactionCount: number;
}

const OwnerAgentsView = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGiveCashDialogOpen, setIsGiveCashDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);


  // Filter agents based on search query
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Fetch agents for the business
  const fetchAgents = async () => {
    if (!session?.user?.businessId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/agents?businessId=${session.user.businessId}`
      );
      if (!response.ok) {
        toast.error("Could not fetch agents.");
        throw new Error("Failed to fetch agents");
      }
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not fetch agents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAgents();
    }
  }, [session]);

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete agent");
      }

      toast.success("Agent deleted successfully!");
      fetchAgents(); // Refresh the list
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    }
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditDialogOpen(true);
  };

  const handleGiveCash = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsGiveCashDialogOpen(true);
  }

  return (
    <div className="p-8">
      <header className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Manage Agents
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            View, add, and manage your agents.
          </p>
        </div>
        <AddAgentDialog onAgentAdded={fetchAgents} />
      </header>

      <div className="flex items-center justify-between my-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow dark:bg-gray-800">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Agent
              </th>
              <th scope="col" className="px-6 py-3">
                Today&apos;s Transactions
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  Loading agents...
                </td>
              </tr>
            ) : filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center">
                  No agents found. Add one to get started.
                </td>
              </tr>
            ) : (
              filteredAgents.map((agent) => (
                <tr
                  key={agent.id}
                  className="bg-white border-b last:border-b-0 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    <div className="flex items-center">
                      <User className="w-8 h-8 mr-3 text-gray-400" />
                      <div>
                        <div>{agent.name}</div>
                        <div className="text-xs text-gray-500">
                          {agent.email}
                        </div>
                      </div>
                    </div>
                  </th>
                  <td className="px-6 py-4">{agent.dailyTransactionCount}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agent.status === "Active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGiveCash(agent)}
                        aria-label="Give cash"
                    >
                        <DollarSign className="w-4 h-4 text-green-500 dark:text-green-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(agent)}
                      aria-label="Edit agent"
                    >
                      <Pencil className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                      aria-label="Delete agent"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedAgent && (
        <EditAgentDialog
          agent={selectedAgent}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onAgentUpdated={() => {
            fetchAgents();
            setIsEditDialogOpen(false);
          }}
        />
      )}
      {selectedAgent && (
        <GiveCashDialog
            open={isGiveCashDialogOpen}
            onOpenChange={setIsGiveCashDialogOpen}
            agentId={selectedAgent.id}
            onCashGiven={() => {
                fetchAgents();
                setIsGiveCashDialogOpen(false);
            }}
        />
      )}
    </div>
  );
};

export default OwnerAgentsView;
