import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen" style={{ width: '100%' }}>
        <AdminSidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
