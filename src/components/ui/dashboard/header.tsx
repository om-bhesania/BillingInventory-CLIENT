import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFetchRolesAndPerms } from "@/lib/perms";
import Sidebar from "./sidebar";
import { usePermissions } from "@/contexts/PermissionsContext";
import { EnhancedNotificationTray } from "@/components/notifications/EnhancedNotificationTray";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.name;
  const email = user?.email;
  const role = user?.role;
  const userData = useFetchRolesAndPerms();
  const { hasModuleAccess } = usePermissions();

  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <Sidebar />
        </div>
        <div className="flex items-center md:ml-auto">
          {/* <Button 
            variant="ghost" 
            size="icon" 
            className="relative group"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="sr-only">Notifications</span>
          </Button> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <div className="text-sm">{name || "User"}</div>
                  <p className="text-xs text-primary/80">{role}</p>
                </div>
                <div className="text-muted-foreground text-xs">{email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EnhancedNotificationTray />
    </header>
  );
}
