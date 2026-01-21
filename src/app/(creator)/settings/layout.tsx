"use client";

import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useEffect, useState } from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return (
    <>
      {/* Settings content with internal navigation */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Desktop: Settings Sidebar Navigation */}
        <aside className="hidden md:flex w-60 flex-col border-r p-4">
          <SettingsSidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile: Tabs Navigation */}
          <div className="md:hidden border-b p-2">
            <SettingsTabs />
          </div>

          {/* Content Area */}
          <main className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
