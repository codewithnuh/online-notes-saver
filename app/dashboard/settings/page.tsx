"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-yellow-400/10 p-3 text-yellow-400">
          <Settings size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Settings</h2>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
        <p className="text-gray-400">Settings functionality coming soon...</p>
      </div>
    </div>
  );
}
