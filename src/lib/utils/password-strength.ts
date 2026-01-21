export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const suggestions: string[] = [];

  if (!password) {
    return {
      score: 0,
      label: "Very Weak",
      color: "text-destructive",
      suggestions: ["Enter a password"],
    };
  }

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    suggestions.push("Use at least 8 characters");
  }

  // Uppercase letter
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push("Include uppercase letters");
  }

  // Lowercase letter
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    suggestions.push("Include lowercase letters");
  }

  // Numbers
  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push("Include numbers");
  }

  // Special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push("Include special characters");
  }

  // Bonus points for longer passwords
  if (password.length >= 12) {
    score = Math.min(score + 1, 5);
  }

  // Cap score if minimum length not met - can't be "Good" or "Strong" without 8 chars
  if (password.length < 8) {
    score = Math.min(score, 2);
  }

  // Determine label and color based on score
  let label: string;
  let color: string;

  switch (score) {
    case 0:
    case 1:
      label = "Very Weak";
      color = "text-destructive";
      break;
    case 2:
      label = "Weak";
      color = "text-destructive";
      break;
    case 3:
      label = "Almost";
      color = "text-secondary";
      break;
    case 4:
      label = "Strong";
      color = "text-primary";
      break;
    case 5:
      label = "Very Strong";
      color = "text-primary";
      break;
    default:
      label = "Very Weak";
      color = "text-destructive";
  }

  return {
    score: Math.min(score, 5),
    label,
    color,
    suggestions,
  };
};

export const getPasswordStrengthBarColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "bg-destructive";
    case 2:
    case 3:
      return "bg-secondary";
    case 4:
      return "bg-primary";
    default:
      return "bg-muted";
  }
};
