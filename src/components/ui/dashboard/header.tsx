import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom"; 
import { useFetchRolesAndPerms } from "@/lib/perms";
import Sidebar from "./sidebar";

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const name = user?.name;
  const email = user?.email;
  const role = user?.role;
  const userData = useFetchRolesAndPerms();
  console.log("User Data:", userData);
  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <Sidebar />
        </div>
        <div className="flex items-center gap-4 md:ml-auto">
          <Sheet
            open={isNotificationsOpen}
            onOpenChange={setIsNotificationsOpen}
          >
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                <span className="sr-only">Notifications</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">New invoice created</p>
                      <p className="text-sm text-muted-foreground">
                        Invoice #1234 has been created for Shop A
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">Inventory low</p>
                      <p className="text-sm text-muted-foreground">
                        Vanilla Flavor is running low in Shop B
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 hours ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
                  <div className="">{name || "User"}</div>
                  <p className="text-[12px] text-gray-700">{role}</p>
                </div>
                <div className="text-muted-foreground text-xs">
                  <div className="text-gray-600 text-[10px]">
                    {email || "jhondoe@gmail.com"}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
