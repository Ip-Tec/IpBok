"use client";
import React, { useState, useEffect } from "react";
import {
  UserPlus,
  User,
  Search,
  Trash2,
  Pencil,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { AddMemberDialog } from "./AddMemberDialog";
import { EditAgentDialog } from "./EditAgentDialog";
import { GiveCashDialog } from "./GiveCashDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  dailyTransactionCount: number;
}

const AgentMobileRow = ({
  agent,
  onEdit,
  onDelete,
  onGiveCash,
}: {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onGiveCash: (agent: Agent) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-white dark:bg-gray-800">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white">
              {agent.name || "Unnamed"}
            </span>
            <span className="text-xs text-gray-500">{agent.email}</span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 transition-transform text-gray-400",
            isOpen ? "rotate-180" : "",
          )}
        />
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Role:</div>
            <div className="text-right">
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                {agent.role}
              </span>
            </div>
            <div className="text-gray-500">Today's Tx:</div>
            <div className="text-gray-900 dark:text-white text-right font-medium">
              {agent.dailyTransactionCount}
            </div>
            <div className="text-gray-500">Status:</div>
            <div className="text-right">
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase",
                  {
                    "bg-green-100 text-green-800": agent.status === "Active",
                    "bg-red-100 text-red-800": agent.status !== "Active",
                  },
                )}
              >
                {agent.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {agent.role === "AGENT" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => onGiveCash(agent)}
              >
                <DollarSign className="w-4 h-4" /> Give Cash
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => onEdit(agent)}
            >
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onDelete(agent.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

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
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Fetch agents for the business
  const fetchAgents = async () => {
    if (!session?.user?.businessId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/agents?businessId=${session.user.businessId}`,
      );
      if (!response.ok) {
        toast.error("Could not fetch team members.");
        throw new Error("Failed to fetch agents");
      }
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not fetch team members.");
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
    if (!confirm("Are you sure you want to delete this member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete member");
      }

      toast.success("Member deleted successfully!");
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
  };

  return (
    <div className="p-4 md:p-8">
      <header className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Manage Team
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View, add, and manage your team members.
          </p>
        </div>
        <AddMemberDialog onMemberAdded={fetchAgents} />
      </header>

      <div className="my-6">
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

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Member
                </th>
                <th scope="col" className="px-6 py-3">
                  Role
                </th>
                <th scope="col" className="px-6 py-3">
                  Today&apos;s Transactions
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    Loading team...
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="bg-white border-b last:border-b-0 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {agent.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{agent.dailyTransactionCount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          {
                            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
                              agent.status === "Active",
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300":
                              agent.status !== "Active",
                          },
                        )}
                      >
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {agent.role === "AGENT" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGiveCash(agent)}
                            title="Give cash"
                          >
                            <DollarSign className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(agent)}
                          title="Edit agent"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(agent.id)}
                          title="Delete agent"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading ? (
            <div className="p-6 text-center">Loading team...</div>
          ) : filteredAgents.length === 0 ? (
            <div className="p-6 text-center">No team members found.</div>
          ) : (
            filteredAgents.map((agent) => (
              <AgentMobileRow
                key={agent.id}
                agent={agent}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onGiveCash={handleGiveCash}
              />
            ))
          )}
        </div>
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
