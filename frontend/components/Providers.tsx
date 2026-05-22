"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgb(20, 20, 40)",
            color: "#f8fafc",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            fontSize: "0.875rem",
            fontFamily: "Inter, sans-serif",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "white" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "white" },
          },
        }}
      />
    </QueryClientProvider>
  );
}
