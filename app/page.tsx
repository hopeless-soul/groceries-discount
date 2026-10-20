import { redirect } from "next/navigation";

// There is no location step: the backend serves every shop, so the home route goes straight to the dashboard.
export default function Page() {
  redirect("/dashboard");
}
