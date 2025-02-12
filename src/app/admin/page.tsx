import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Page() {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          <h1>Hello BLOG!</h1>
        </main>
      </SidebarProvider>
    );
  }