'use client';
import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/sidebar"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen" style={{ width: '100%' }}>
          <AdminSidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
