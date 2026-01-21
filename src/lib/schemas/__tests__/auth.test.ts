import { loginSchema, registrationSchema } from "../auth";

describe("Auth Schemas", () => {
  describe("loginSchema", () => {
    it("validates correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "ValidPass123!",
        rememberMe: true,
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "ValidPass123!",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "short",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("registrationSchema", () => {
    it("validates correct registration data", () => {
      const validData = {
        email: "newuser@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
        user_type: "creator",
        acceptTerms: true,
      };

      const result = registrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects when passwords do not match", () => {
      const invalidData = {
        email: "test@example.com",
        password: "SecurePass123!",
        confirmPassword: "DifferentPass123!",
        firstName: "John",
        lastName: "Doe",
        user_type: "creator",
        acceptTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects when terms not accepted", () => {
      const invalidData = {
        email: "test@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
        user_type: "creator",
        acceptTerms: false,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects invalid user_type", () => {
      const invalidData = {
        email: "test@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
        user_type: "invalid",
        acceptTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects missing firstName", () => {
      const invalidData = {
        email: "test@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        lastName: "Doe",
        user_type: "creator",
        acceptTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects missing lastName", () => {
      const invalidData = {
        email: "test@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        firstName: "John",
        user_type: "creator",
        acceptTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
