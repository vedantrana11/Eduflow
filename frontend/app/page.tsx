"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 animate-pulse" />
        <p style={{ color: "rgb(148 163 184)", fontSize: "0.875rem" }}>Loading EduFlow AI...</p>
      </div>
    </div>
  );
}
