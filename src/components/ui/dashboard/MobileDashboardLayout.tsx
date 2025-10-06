import React, { useState } from 'react';
import { Button } from '../button';
import { Sheet, SheetContent, SheetTrigger } from '../sheet';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';
import Sidebar from './sidebar';

interface MobileDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileDashboardLayout: React.FC<MobileDashboardLayoutProps> = ({
  children,
  className
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile } = useResponsive();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center space-x-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center justify-between px-4 border-b">
                    <h2 className="text-lg font-semibold">Blizz</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Sidebar />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </header>
      )}

      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex flex-1">
          <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
            <div className="flex min-h-0 flex-1 flex-col border-r bg-background">
              <Sidebar />
            </div>
          </div>
          <div className="flex flex-1 flex-col md:pl-64">
            <main className={cn('flex-1 p-4 md:p-6', className)}>
              {children}
            </main>
          </div>
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <main className={cn('flex-1 p-4', className)}>
          {children}
        </main>
      )}
    </div>
  );
};

export default MobileDashboardLayout;
