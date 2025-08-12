import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  HomeIcon,
  PackageIcon,
  FileTextIcon,
  UsersIcon,
  StoreIcon,
  ShoppingCartIcon,
  ChevronDown,
  ChevronUp,
  PlusIcon,
  EyeIcon,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<any>;
  module?: string;
  requiredActions?: string[];
  children?: NavItem[];
  badge?: string | number;
}

const Sidebar: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission, isModuleAccessible } = usePermissions();

  // Navigation with permissions info
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: HomeIcon,
      module: "Home",
      requiredActions: ["read"],
    },
    {
      title: "Inventory Management",
      icon: PackageIcon,
      module: "Inventory",
      requiredActions: ["read"],
      children: [
        {
          title: "View Inventory",
          href: "/inventory",
          icon: EyeIcon,
          module: "Inventory",
          requiredActions: ["read"],
        },
        {
          title: "Add Item",
          href: "/inventory/add",
          icon: PlusIcon,
          module: "Inventory",
          requiredActions: ["write"],
        },
      ],
    },
    {
      title: "Billing",
      icon: FileTextIcon,
      module: "Billing",
      requiredActions: ["read"],
      children: [
        {
          title: "View Invoices",
          href: "/invoices",
          icon: EyeIcon,
          module: "Billing",
          requiredActions: ["read"],
        },
        {
          title: "Create Invoice",
          href: "/invoices/add",
          icon: PlusIcon,
          module: "Billing",
          requiredActions: ["write"],
        },
      ],
    },
    {
      title: "Employee Management",
      icon: UsersIcon,
      module: "Employee",
      requiredActions: ["read"],
      children: [
        {
          title: "View Employees",
          href: "/employees",
          icon: EyeIcon,
          module: "Employee",
          requiredActions: ["read"],
        },
        {
          title: "Add Employee",
          href: "/employees/add",
          icon: PlusIcon,
          module: "Employee",
          requiredActions: ["write"],
        },
      ],
    },
    {
      title: "Shop Management",
      icon: StoreIcon,
      module: "Shop",
      requiredActions: ["read"],
      children: [
        {
          title: "View Shops",
          href: "/shops",
          icon: EyeIcon,
          module: "Shop",
          requiredActions: ["read"],
        },
        {
          title: "Add Shop",
          href: "/shops/add",
          icon: PlusIcon,
          module: "Shop",
          requiredActions: ["write"],
        },
      ],
    },
    {
      title: "Shop Inventory",
      icon: ShoppingCartIcon,
      module: "Shop Inventory",
      requiredActions: ["read"],
      children: [
        {
          title: "View Shop Inventory",
          href: "/shop-inventory",
          icon: EyeIcon,
          module: "Shop Inventory",
          requiredActions: ["read"],
        },
        {
          title: "Add Stock",
          href: "/shop-inventory/add",
          icon: PlusIcon,
          module: "Shop Inventory",
          requiredActions: ["write"],
        },
      ],
    },
  ];

  // Check if user has all required actions for item
  const hasRequiredPermissions = (item: NavItem): boolean => {
    if (!item.module || !item.requiredActions) return true;
    return item.requiredActions.every((action) =>
      hasPermission(item.module!, action)
    );
  };

  // Filter nav items recursively
  const getFilteredNavItems = (): NavItem[] => {
    if (!user) return [];

    const filterNavItem = (item: NavItem): NavItem | null => {
      if (item.module && !isModuleAccessible(item.module)) return null;
      if (!hasRequiredPermissions(item)) return null;

      if (item.children) {
        const filteredChildren = item.children
          .map(filterNavItem)
          .filter((child): child is NavItem => child !== null);
        if (filteredChildren.length === 0 && !item.href) return null;

        return { ...item, children: filteredChildren };
      }

      return item;
    };

    return navItems.map(filterNavItem).filter((i): i is NavItem => i !== null);
  };

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href?: string) => href === location.pathname;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isExpanded = expandedItems[item.title] || false;
    const hasActiveChild = item.children?.some((child) => isActive(child.href));

    return (
      <div className="w-full">
        {item.children ? (
          <div className="w-full">
            <button
              onClick={() => toggleExpand(item.title)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50",
                (isActive(item.href) || hasActiveChild) &&
                  "bg-accent/50 text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {isExpanded && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.title}
                    to={child.href || "#"}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50",
                      isActive(child.href) &&
                        "bg-accent/50 text-accent-foreground"
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <div className="h-1 w-1 rounded-full bg-current" />
                    <span>{child.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link
            to={item.href || "#"}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50",
              isActive(item.href) && "bg-accent/50 text-accent-foreground"
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.title}</span>
          </Link>
        )}
      </div>
    );
  };

  const renderNavItems = () => (
    <div className="flex w-full flex-col gap-1">
      {getFilteredNavItems().map((item) => (
        <NavItemComponent key={item.title} item={item} />
      ))}
    </div>
  );

  return (
    <>
      <div className="hidden h-screen w-64 flex-col border-r bg-background p-4 md:flex">
        <div className="flex h-10 items-center px-2">
          <h2 className="text-lg font-semibold">Blizz</h2>
        </div>
        <div className="mt-8 flex flex-1 flex-col gap-4">
          {renderNavItems()}
        </div>
        <div className="mt-auto pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start"
            onClick={() => {}}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Log out</span>
          </Button>
        </div>
      </div>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="ml-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-4"
          onInteractOutside={() => setIsMobileOpen(false)}
        >
          <div className="flex h-10 items-center px-2">
            <h2 className="text-lg font-semibold">Blizz</h2>
          </div>
          <div className="mt-8 flex flex-1 flex-col gap-4">
            {renderNavItems()}
          </div>
          <div className="mt-auto pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start"
              onClick={() => {}}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Log out</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
