"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "rgb(8, 8, 16)" }}>
      <Sidebar />
      <div className="main-content flex-1">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
