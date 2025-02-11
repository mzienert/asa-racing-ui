'use client'

import { Provider } from 'react-redux'
import { store } from './store/store'
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </Provider>
  )
} 