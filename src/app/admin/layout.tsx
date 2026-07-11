import { redirect } from "next/navigation";
import { getSessionUser } from "../auth-actions";
import { supabaseServer } from "@/lib/supabase-server";

async function isAdmin(userId: number | undefined) {
  if (!userId) return false;
  const { data, error } = await supabaseServer
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return false;
  return data.role === "admin";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  
  if (!session || !(await isAdmin(session.id))) {
    redirect("/");
  }

  return <>{children}</>;
}
