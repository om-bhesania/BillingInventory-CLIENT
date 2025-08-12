
import { ReactNode } from "react";
import { Header } from "./header";  
import Sidebar from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className=" flex-1">
        <div className="hidden md:fixed top-0 left-0 h-full w-64 overflow-y-auto bg-sidebar md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 md:p-6 md:ml-64">{children}</main>
      </div>
    </div>
  );
}
