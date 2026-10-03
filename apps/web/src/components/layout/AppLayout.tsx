import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { LowStockBanner } from './LowStockBanner';

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <div data-print-exclude>
        <Header onMenuClick={() => setDrawerOpen(true)} />
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside data-print-exclude className="hidden lg:block lg:w-64 lg:shrink-0 border-e bg-card">
          <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* Mobile Drawer */}
        <div data-print-exclude>
          <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <LowStockBanner />
          <div className="container mx-auto max-w-7xl p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}