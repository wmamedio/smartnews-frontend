import { calculatePasswordStrength } from "../password-strength";

describe("Password Strength Calculator", () => {
  it("returns weak for short passwords", () => {
    const result = calculatePasswordStrength("abc");
    expect(result.label).toBe("Very Weak");
    expect(result.score).toBe(1); // Only has lowercase
    expect(result.color).toBe("text-destructive");
    expect(result.suggestions).toContain("Use at least 8 characters");
  });

  it("returns medium for moderate passwords", () => {
    const result = calculatePasswordStrength("password123");
    expect(result.label).toBe("Good");
    expect(result.score).toBe(3); // Has lowercase, numbers, length>=8
    expect(result.suggestions).toContain("Include uppercase letters");
    expect(result.suggestions).toContain("Include special characters");
  });

  it("returns strong for complex passwords", () => {
    const result = calculatePasswordStrength("MyStr0ng!P@ssw0rd123");
    expect(result.label).toBe("Very Strong");
    expect(result.score).toBe(5); // Has all criteria + length bonus
    expect(result.suggestions).toHaveLength(0);
  });

  it("handles empty passwords", () => {
    const result = calculatePasswordStrength("");
    expect(result.label).toBe("Very Weak");
    expect(result.score).toBe(0);
    expect(result.suggestions).toContain("Enter a password");
  });

  it("rewards password length", () => {
    const short = calculatePasswordStrength("Ab1!");
    const long = calculatePasswordStrength("Ab1!Ab1!Ab1!Ab1!");
    expect(long.score).toBeGreaterThan(short.score);
  });

  it("rewards character variety", () => {
    const simple = calculatePasswordStrength("aaaaaaaa");
    const complex = calculatePasswordStrength("aA1!aA1!");
    expect(complex.score).toBeGreaterThan(simple.score);
  });
});
