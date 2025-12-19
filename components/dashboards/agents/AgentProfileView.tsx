"use client";
import { User } from "@/lib/types";
import React from "react";
import { AtSign, Phone, Building, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentProfileViewProps {
  user: User;
}

const AgentProfileView = ({ user }: AgentProfileViewProps) => {
  return (
    <div className="p-8">
      <header className="pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          My Profile
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          View and manage your personal information.
        </p>
      </header>

      <div className="mt-8 max-w-2xl mx-auto">
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex flex-col items-center sm:flex-row">
            <UserIcon className="w-24 h-24 text-gray-400" />
            <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {user.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <AtSign className="w-5 h-5 text-gray-400" />
                <span className="ml-3 text-gray-700 dark:text-gray-300">
                  {user.email}
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="ml-3 text-gray-700 dark:text-gray-300">
                  {/* Assuming phone is available in user object */}
                  {/* {user.phone || "Not provided"} */}
                  +234 812 345 6789
                </span>
              </li>
              <li className="flex items-center">
                <Building className="w-5 h-5 text-gray-400" />
                <span className="ml-3 text-gray-700 dark:text-gray-300">
                  {/* Assuming business name is available */}
                  Business ID: {user.businessId || "N/A"}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 border-t pt-6 text-right">
            <Button variant="outline">Edit Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfileView;
