import { Trophy, Users, ListTodo, ListOrdered } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import Link from 'next/link';

const navigationItems = [
  {
    title: 'Race Management',
    icon: Trophy,
    href: '/admin/races',
  },
  {
    title: 'Racers',
    icon: Users,
    href: '/admin/racers',
  },
  {
    title: 'Brackets',
    icon: ListOrdered,
    href: '/admin/brackets',
  },
  {
    title: 'Results',
    icon: ListTodo,
    href: '/admin/results',
  },
];

interface AdminSidebarProps {
  variant?: 'sidebar' | 'floating' | 'inset';
}

export function AdminSidebar({ variant }: AdminSidebarProps) {
  return (
    <Sidebar variant={variant}>
      <SidebarHeader>
        <Link href="/admin">
          <h2 className="px-6 text-lg font-semibold hover:text-primary cursor-pointer">
            ASA Racing Admin
          </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
