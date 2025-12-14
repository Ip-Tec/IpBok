import React from "react";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
}

const KpiCard = ({ title, value, description }: KpiCardProps) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      <p className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};

export default KpiCard;
