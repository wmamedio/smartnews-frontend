import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  // userType doesn't matter for login - backend detects user type from email
  return <AuthForm mode="login" userType="subscriber" />;
}
