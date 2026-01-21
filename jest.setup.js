import "@testing-library/jest-dom";

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = "https://localhost:8000";

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.location by spying on the href setter to avoid JSDOM navigation errors
const mockLocation = { href: "", assign: jest.fn(), reload: jest.fn(), replace: jest.fn() };

// Use a getter/setter pattern to avoid JSDOM redefine issues
let currentHref = "";
Object.defineProperty(mockLocation, "href", {
  get: () => currentHref,
  set: (value) => {
    currentHref = value;
  }, // Simply store the value without navigation
});

// Replace window.location only if we can
try {
  Object.defineProperty(window, "location", {
    value: mockLocation,
    configurable: true,
    writable: true,
  });
} catch (e) {
  // If JSDOM blocks it, just warn
  console.warn("Could not mock window.location, navigation tests may have issues");
}

// Mock pointer capture methods for Radix UI components
// Radix UI's Select and other components use pointer events that jsdom doesn't fully support
if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = jest.fn(() => false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = jest.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = jest.fn();
  }
}

// Mock next/navigation
jest.mock("next/navigation", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  };

  return {
    useRouter: jest.fn(() => mockRouter),
    useSearchParams: jest.fn(() => ({
      get: jest.fn(),
    })),
    usePathname: jest.fn(() => ""),
    redirect: jest.fn(), // Add redirect mock for server components
  };
});
