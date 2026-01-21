/**
 * Extract a user-friendly error message from an API error
 * @param error - The error object from axios or other sources
 * @param defaultMessage - Default message if no specific error is found
 * @returns User-friendly error message
 */
export function extractErrorMessage(
  error: any,
  defaultMessage: string = "An error occurred"
): string {
  // Check for FastAPI validation errors
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;

    // If detail is an array (validation errors)
    if (Array.isArray(detail)) {
      return detail
        .map((e: any) => {
          const location = e.loc?.slice(1).join(".") || "field";
          return `${location}: ${e.msg}`;
        })
        .join(", ");
    }

    // If detail is a string
    if (typeof detail === "string") {
      return detail;
    }

    // If detail is a single validation error object
    if (detail && typeof detail === "object" && "msg" in detail) {
      const location = detail.loc?.slice(1).join(".") || "field";
      return `${location}: ${detail.msg}`;
    }
  }

  // Check for axios error message
  if (error.message) {
    return error.message;
  }

  // Fallback
  return defaultMessage;
}

/**
 * Format validation errors for display
 * @param errors - Array of validation errors from FastAPI
 * @returns Formatted error messages
 */
export function formatValidationErrors(
  errors: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>
): string[] {
  return errors.map((error) => {
    const field = error.loc.slice(1).join(".") || "field";
    return `${field}: ${error.msg}`;
  });
}
