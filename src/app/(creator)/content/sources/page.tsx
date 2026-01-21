"use client";

import { SourceManager } from "@/components/content/sources/SourceManager";

export default function ContentSourcesPage() {
  return (
    <>
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <SourceManager />
      </main>
    </>
  );
}
