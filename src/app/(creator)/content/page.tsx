import { redirect } from "next/navigation";

export default function ContentPage() {
  // Redirect to Library by default
  // (User can go to Import if no content exists via empty state)
  redirect("/content/library");
}
