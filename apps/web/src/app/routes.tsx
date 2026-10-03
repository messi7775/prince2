import { Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { PackagesPage } from '../features/packages/pages/PackagesPage';
import { InventoryPage } from '../features/inventory/pages/InventoryPage';
import { PackageInventoryPage } from '../features/inventory/pages/PackageInventoryPage';
import { DistributorsPage } from '../features/distributors/pages/DistributorsPage';
import { DistributorDetailsPage } from '../features/distributors/pages/DistributorDetailsPage';
import { SalesPage } from '../features/sales/pages/SalesPage';
import { SaleDetailsPage } from '../features/sales/pages/SaleDetailsPage';
import { CashPage } from '../features/cash/pages/CashPage';
import { LinesPage } from '../features/lines/pages/LinesPage';
import { LineDetailsPage } from '../features/lines/pages/LineDetailsPage';
import { ExpenseCategoriesPage } from '../features/expense-categories/pages/ExpenseCategoriesPage';
import { ExpensesPage } from '../features/expenses/pages/ExpensesPage';
import { OwnerWithdrawalsPage } from '../features/owner-withdrawals/pages/OwnerWithdrawalsPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { SearchPage } from '../features/search/pages/SearchPage';
import { AuditLogsPage } from '../features/audit-log/pages/AuditLogsPage';
import { BackupPage } from '../features/backup/pages/BackupPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';

export const routes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      // ─── Public ───
      {
        path: '/login',
        element: <LoginPage />,
      },

      // ─── Protected ───
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: '/',
                element: <Navigate to="/dashboard" replace />,
              },
              {
                path: '/dashboard',
                element: <DashboardPage />,
              },
              {
                path: '/packages',
                element: <PackagesPage />,
              },
              {
                path: '/inventory',
                element: <InventoryPage />,
              },
              {
                path: '/inventory/:packageId',
                element: <PackageInventoryPage />,
              },
              {
                path: '/distributors',
                element: <DistributorsPage />,
              },
              {
                path: '/distributors/:id',
                element: <DistributorDetailsPage />,
              },
              {
                path: '/sales',
                element: <SalesPage />,
              },
              {
                path: '/sales/:id',
                element: <SaleDetailsPage />,
              },
              {
                path: '/cash',
                element: <CashPage />,
              },
              {
                path: '/lines',
                element: <LinesPage />,
              },
              {
                path: '/lines/:id',
                element: <LineDetailsPage />,
              },
              {
                path: '/line-payments',
                element: <Navigate to="/lines" replace />,
              },
              {
                path: '/expense-categories',
                element: <ExpenseCategoriesPage />,
              },
              {
                path: '/expenses',
                element: <ExpensesPage />,
              },
              {
                path: '/owner-withdrawals',
                element: <OwnerWithdrawalsPage />,
              },
              {
                path: '/reports',
                element: <ReportsPage />,
              },
              {
                path: '/search',
                element: <SearchPage />,
              },
              {
                path: '/audit-log',
                element: <AuditLogsPage />,
              },
              {
                path: '/backup',
                element: <BackupPage />,
              },
              {
                path: '/settings',
                element: <SettingsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
];
