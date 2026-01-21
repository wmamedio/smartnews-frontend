"use client";

import { SocialConnections } from "@/components/settings/SocialConnections";

export default function SocialConnectionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Social Connections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your social media accounts to import content and grow your audience
        </p>
      </div>

      {/* Social Connections Component */}
      <SocialConnections />
    </div>
  );
}
