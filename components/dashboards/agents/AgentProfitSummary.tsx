import { useState } from "react";
import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { TrendingUp } from "lucide-react";
interface AgentProfitData {
  agentId: string;
  agentName: string;
  agentEmail: string;
  totalCashGiven: number;
  totalCharges: number;
  profit: number;
  profitMargin: number;
  transactionCount: number;
}

interface ProfitSummaryData {
  period: {
    startDate: string;
    endDate: string;
  };
  overall: {
    totalCashGiven: number;
    totalCharges: number;
    totalProfit: number;
    totalProfitMargin: number;
    totalTransactions: number;
  };
  agents: AgentProfitData[];
}

const ProfitMobileRow = ({ agent }: { agent: AgentProfitData }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white">
            {agent.agentName}
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              agent.profit >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            Profit: ₦{agent.profit.toLocaleString()} (
            {agent.profitMargin >= 0 ? "+" : ""}
            {agent.profitMargin.toFixed(2)}%)
          </span>
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
            <div className="text-gray-500">Email:</div>
            <div className="text-right text-gray-700 dark:text-gray-300 truncate">
              {agent.agentEmail}
            </div>
            <div className="text-gray-500">Cash Given:</div>
            <div className="text-right text-gray-900 dark:text-white font-medium">
              ₦{agent.totalCashGiven.toLocaleString()}
            </div>
            <div className="text-gray-500">Charges:</div>
            <div className="text-right text-gray-900 dark:text-white font-medium">
              ₦{agent.totalCharges.toLocaleString()}
            </div>
            <div className="text-gray-500">Transactions:</div>
            <div className="text-right text-gray-900 dark:text-white font-medium">
              {agent.transactionCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function AgentProfitSummary() {
  const [data, setData] = useState<ProfitSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchProfitSummary();
  }, [days]);

  const fetchProfitSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/profit-summary?days=${days}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profit summary");
      }
      const profitData = await response.json();
      setData(profitData);
    } catch (error) {
      console.error("Error fetching profit summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Agent Profit Summary
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Agent Profit Summary
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400">
          No data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agent Profit Summary
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Period: {new Date(data.period.startDate).toLocaleDateString()} -{" "}
            {new Date(data.period.endDate).toLocaleDateString()}
          </p>
        </div>
        <Select
          value={days.toString()}
          onValueChange={(value) => setDays(parseInt(value))}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        {/* Overall Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Cash Given
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ₦{data.overall.totalCashGiven.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Charges
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ₦{data.overall.totalCharges.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Profit
                </p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    data.overall.totalProfit >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  ₦{data.overall.totalProfit.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg dark:bg-orange-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Transactions
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {data.overall.totalTransactions}
                </p>
              </div>
              <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Agent Details - Table on Desktop, Cards on Mobile */}
        <div className="mt-8 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Agent Performance Details
            </h4>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Agent Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Cash Given
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Charges
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Profit
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Profit Margin
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.agents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No agents found
                    </td>
                  </tr>
                ) : (
                  data.agents.map((agent) => (
                    <tr
                      key={agent.agentId}
                      className="bg-white border-b last:border-b-0 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {agent.agentName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.agentEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-300">
                        ₦{agent.totalCashGiven.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-300">
                        ₦{agent.totalCharges.toLocaleString()}
                      </td>
                      <td
                        className={cn(
                          "px-6 py-4 font-semibold",
                          agent.profit >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        ₦{agent.profit.toLocaleString()}
                      </td>
                      <td
                        className={cn(
                          "px-6 py-4",
                          agent.profitMargin >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {agent.profitMargin >= 0 ? "+" : ""}
                        {agent.profitMargin.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-300">
                        {agent.transactionCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {data.agents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No agents found
              </div>
            ) : (
              data.agents.map((agent) => (
                <ProfitMobileRow key={agent.agentId} agent={agent} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
