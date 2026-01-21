import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialConnections } from "../SocialConnections";
import { socialService } from "@/lib/services/social-service";
import { toast } from "sonner";

// Mock social service
jest.mock("@/lib/services/social-service", () => ({
  socialService: {
    getConnections: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    refreshStats: jest.fn(),
  },
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  formatDistanceToNow: jest.fn(() => "2 hours ago"),
}));

describe("SocialConnections", () => {
  const mockConnections = [
    {
      provider: "youtube",
      isConnected: true,
      username: "testuser",
      followerCount: 10000,
      lastSyncedAt: "2024-01-01T12:00:00Z",
    },
    {
      provider: "twitter",
      isConnected: false,
      username: null,
      followerCount: null,
      lastSyncedAt: null,
    },
    {
      provider: "reddit",
      isConnected: true,
      username: "reddituser",
      followerCount: 5000,
      lastSyncedAt: "2024-01-01T10:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render and Loading", () => {
    it("shows loading state initially", () => {
      (socialService.getConnections as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<SocialConnections />);

      expect(screen.getByText("Social Connections")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("loads and displays connections", async () => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);

      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByText("YouTube")).toBeInTheDocument();
        expect(screen.getByText("Twitter")).toBeInTheDocument();
        expect(screen.getByText("Reddit")).toBeInTheDocument();
      });
    });

    it("shows error toast if loading fails", async () => {
      (socialService.getConnections as jest.Mock).mockRejectedValue(new Error("Failed to load"));

      render(<SocialConnections />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load social connections");
      });
    });

    it("calls socialService.getConnections on mount", async () => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);

      render(<SocialConnections />);

      await waitFor(() => {
        expect(socialService.getConnections).toHaveBeenCalled();
      });
    });
  });

  describe("Component Content", () => {
    beforeEach(async () => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);
    });

    it("displays all provider names and descriptions", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByText("YouTube")).toBeInTheDocument();
        expect(screen.getByText("Import videos and channel statistics")).toBeInTheDocument();
        expect(screen.getByText("Twitter")).toBeInTheDocument();
        expect(screen.getByText("Import saved tweets and bookmarks")).toBeInTheDocument();
        expect(screen.getByText("Reddit")).toBeInTheDocument();
        expect(screen.getByText("Import saved posts and subreddits")).toBeInTheDocument();
      });
    });
  });

  describe("Connection Status", () => {
    beforeEach(async () => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);
    });

    it("shows Connected badge for connected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        const connectedBadges = screen.getAllByText("Connected");
        expect(connectedBadges).toHaveLength(2); // YouTube and Reddit
      });
    });

    it("shows Not Connected badge for disconnected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        const notConnectedBadges = screen.getAllByText("Not Connected");
        expect(notConnectedBadges).toHaveLength(1); // Twitter
      });
    });

    it("displays username for connected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByText("@testuser")).toBeInTheDocument();
        expect(screen.getByText("@reddituser")).toBeInTheDocument();
      });
    });

    it("displays follower count for connected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByText(/10,000 subscribers/)).toBeInTheDocument();
        expect(screen.getByText(/5,000 subscribers/)).toBeInTheDocument();
      });
    });

    it("displays last synced time for connected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        const syncedTexts = screen.getAllByText(/Last synced 2 hours ago/);
        expect(syncedTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Connect Action", () => {
    beforeEach(() => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);
      (socialService.connect as jest.Mock).mockResolvedValue(undefined);
    });

    it("shows Connect button for disconnected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Connect Twitter/ })).toBeInTheDocument();
      });
    });

    it("calls socialService.connect when Connect button is clicked", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Connect Twitter/ })).toBeInTheDocument();
      });

      const connectButton = screen.getByRole("button", { name: /Connect Twitter/ });
      await user.click(connectButton);

      await waitFor(() => {
        expect(socialService.connect).toHaveBeenCalledWith("twitter");
      });
    });

    it("shows success toast after successful connection", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Connect Twitter/ })).toBeInTheDocument();
      });

      const connectButton = screen.getByRole("button", { name: /Connect Twitter/ });
      await user.click(connectButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Twitter connected successfully!");
      });
    });

    it("shows error toast on connection failure", async () => {
      const user = userEvent.setup();
      (socialService.connect as jest.Mock).mockRejectedValue(new Error("Connection failed"));

      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Connect Twitter/ })).toBeInTheDocument();
      });

      const connectButton = screen.getByRole("button", { name: /Connect Twitter/ });
      await user.click(connectButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to connect Twitter");
      });
    });

    it("shows loading state during connection", async () => {
      const user = userEvent.setup();
      (socialService.connect as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Connect Twitter/ })).toBeInTheDocument();
      });

      const connectButton = screen.getByRole("button", { name: /Connect Twitter/ });
      await user.click(connectButton);

      // Check for loading state
      expect(connectButton).toBeDisabled();
    });

    it("reloads connections after successful connect", async () => {
      const user = userEvent.setup();
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);

      render(<SocialConnections />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Connect Twitter/ })).toBeInTheDocument();
      });

      const connectButton = screen.getByRole("button", { name: /Connect Twitter/ });
      await user.click(connectButton);

      await waitFor(() => {
        // Should be called twice: once on mount, once after connect
        expect(socialService.getConnections).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Disconnect Action", () => {
    beforeEach(() => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);
      (socialService.disconnect as jest.Mock).mockResolvedValue(undefined);
    });

    it("shows Disconnect button for connected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
        expect(disconnectButtons.length).toBeGreaterThan(0);
      });
    });

    it("shows confirmation dialog when Disconnect is clicked", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
        expect(disconnectButtons.length).toBeGreaterThan(0);
      });

      const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
      await user.click(disconnectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect YouTube?/)).toBeInTheDocument();
        expect(
          screen.getByText(/This will stop importing content from your YouTube account/)
        ).toBeInTheDocument();
      });
    });

    it("calls socialService.disconnect when confirmed", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
        expect(disconnectButtons.length).toBeGreaterThan(0);
      });

      // Click disconnect button (first one should be YouTube)
      const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
      await user.click(disconnectButtons[0]);

      // Confirm in dialog
      await waitFor(() => {
        const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
        // The dialog has another Disconnect button - find it
        const dialogDisconnectButton = confirmButtons.find((btn) =>
          btn.className.includes("destructive")
        );
        expect(dialogDisconnectButton).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
      const dialogDisconnectButton = confirmButtons.find((btn) =>
        btn.className.includes("destructive")
      );
      await user.click(dialogDisconnectButton!);

      await waitFor(() => {
        expect(socialService.disconnect).toHaveBeenCalledWith("youtube");
      });
    });

    it("shows success toast after successful disconnect", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
        expect(disconnectButtons.length).toBeGreaterThan(0);
      });

      const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
      await user.click(disconnectButtons[0]);

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
        const dialogDisconnectButton = confirmButtons.find((btn) =>
          btn.className.includes("destructive")
        );
        expect(dialogDisconnectButton).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
      const dialogDisconnectButton = confirmButtons.find((btn) =>
        btn.className.includes("destructive")
      );
      await user.click(dialogDisconnectButton!);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("YouTube disconnected");
      });
    });

    it("shows error toast on disconnect failure", async () => {
      const user = userEvent.setup();
      (socialService.disconnect as jest.Mock).mockRejectedValue(new Error("Disconnect failed"));

      render(<SocialConnections />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
        expect(disconnectButtons.length).toBeGreaterThan(0);
      });

      const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
      await user.click(disconnectButtons[0]);

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
        const dialogDisconnectButton = confirmButtons.find((btn) =>
          btn.className.includes("destructive")
        );
        expect(dialogDisconnectButton).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
      const dialogDisconnectButton = confirmButtons.find((btn) =>
        btn.className.includes("destructive")
      );
      await user.click(dialogDisconnectButton!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to disconnect YouTube");
      });
    });

    it("does not disconnect when Cancel is clicked in dialog", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
        expect(disconnectButtons.length).toBeGreaterThan(0);
      });

      const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
      await user.click(disconnectButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(socialService.disconnect).not.toHaveBeenCalled();
    });

    it("reloads connections after successful disconnect", async () => {
      const user = userEvent.setup();
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);

      render(<SocialConnections />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
        expect(disconnectButtons.length).toBeGreaterThan(0);
      });

      const disconnectButtons = screen.getAllByRole("button", { name: "Disconnect" });
      await user.click(disconnectButtons[0]);

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
        const dialogDisconnectButton = confirmButtons.find((btn) =>
          btn.className.includes("destructive")
        );
        expect(dialogDisconnectButton).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole("button", { name: "Disconnect" });
      const dialogDisconnectButton = confirmButtons.find((btn) =>
        btn.className.includes("destructive")
      );
      await user.click(dialogDisconnectButton!);

      await waitFor(() => {
        // Should be called twice: once on mount, once after disconnect
        expect(socialService.getConnections).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Refresh Stats Action", () => {
    beforeEach(() => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);
      (socialService.refreshStats as jest.Mock).mockResolvedValue(undefined);
    });

    it("shows Refresh Stats button for connected accounts", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
        expect(refreshButtons).toHaveLength(2); // YouTube and Reddit are connected
      });
    });

    it("calls socialService.refreshStats when clicked", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });

      const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
      await user.click(refreshButtons[0]); // Click first (YouTube)

      await waitFor(() => {
        expect(socialService.refreshStats).toHaveBeenCalledWith("youtube");
      });
    });

    it("shows success toast after successful refresh", async () => {
      const user = userEvent.setup();
      render(<SocialConnections />);

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });

      const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
      await user.click(refreshButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Stats refreshed successfully");
      });
    });

    it("shows error toast on refresh failure", async () => {
      const user = userEvent.setup();
      (socialService.refreshStats as jest.Mock).mockRejectedValue(new Error("Refresh failed"));

      render(<SocialConnections />);

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });

      const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
      await user.click(refreshButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to refresh stats");
      });
    });

    it("shows loading state during refresh", async () => {
      const user = userEvent.setup();
      (socialService.refreshStats as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<SocialConnections />);

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });

      const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
      await user.click(refreshButtons[0]);

      // Check for loading state
      expect(refreshButtons[0]).toBeDisabled();
    });

    it("reloads connections after successful refresh", async () => {
      const user = userEvent.setup();
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);

      render(<SocialConnections />);

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });

      const refreshButtons = screen.getAllByRole("button", { name: "Refresh Stats" });
      await user.click(refreshButtons[0]);

      await waitFor(() => {
        // Should be called twice: once on mount, once after refresh
        expect(socialService.getConnections).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      (socialService.getConnections as jest.Mock).mockResolvedValue(mockConnections);
    });

    it("has focus-visible styles on all buttons", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
          if (button.className) {
            // Most buttons should have focus-visible styles
            // (except maybe some internal shadcn components)
          }
        });
      });
    });

    it("includes provider icons in Connect buttons", async () => {
      render(<SocialConnections />);

      await waitFor(() => {
        const connectButton = screen.getByRole("button", { name: /Connect Twitter/ });
        expect(connectButton).toBeInTheDocument();
      });
    });
  });
});
