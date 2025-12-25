"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

const KpiCard = ({ title, value, description, icon: Icon, change, changeType }: { title: string, value: string, description?: string, icon: React.ElementType, change?: string, changeType?: 'increase' | 'decrease' }) => (
  <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
    <div className="flex items-center">
      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-xl font-bold text-gray-800 dark:text-white">
          {value}
        </p>
      </div>
    </div>
    {description && (
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    )}
    {change && (
      <div className="flex items-center mt-2">
        <span
          className={cn(
            "flex items-center text-sm font-medium",
            changeType === "increase" ? "text-green-500" : "text-red-500"
          )}
        >
          {changeType === "increase" ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          {change}
        </span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          vs last period
        </span>
      </div>
    )}
  </div>
);

export default KpiCard;