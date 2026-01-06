"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

const KpiCard = ({
  title,
  value,
  description,
  icon: Icon,
  change,
  changeType,
  className,
  valueClassName,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  change?: string;
  changeType?: "increase" | "decrease";
  className?: string;
  valueClassName?: string;
}) => (
  <div
    className={cn(
      "p-4 bg-card rounded-lg shadow border border-border",
      className,
    )}
  >
    <div className="flex items-center">
      <div className="p-3 bg-primary/10 rounded-full">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-xl font-bold text-foreground", valueClassName)}>
          {value}
        </p>
      </div>
    </div>
    {description && (
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    )}
    {change && (
      <div className="flex items-center mt-2">
        <span
          className={cn(
            "flex items-center text-sm font-medium",
            changeType === "increase" ? "text-green-500" : "text-red-500",
          )}
        >
          {changeType === "increase" ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          {change}
        </span>
        <span className="ml-2 text-sm text-muted-foreground">
          vs last period
        </span>
      </div>
    )}
  </div>
);

export default KpiCard;
