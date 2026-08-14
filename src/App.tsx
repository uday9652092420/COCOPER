/**
 * @file App.tsx
 * @description Application root with routing and authentication guard.
 */

import React from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { MainLayout } from './layouts/MainLayout'
import LoginPage from './pages/Auth/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import BranchMasterPage from './pages/masters/BranchMasterPage'
import ItemMasterPage from './pages/masters/ItemMasterPage'
import GunnyBagMasterPage from './pages/masters/GunnyBagMasterPage'
import SupplierMasterPage from './pages/masters/SupplierMasterPage'
import CustomerMasterPage from './pages/masters/CustomerMasterPage'
import LabourMasterPage from './pages/masters/LabourMasterPage'
import PurchaseOrderPage from './pages/transactions/PurchaseOrderPage'
import PurchaseInvoicePage from './pages/transactions/PurchaseInvoicePage'
import DirectSalesPage from './pages/transactions/DirectSalesPage'
import IndirectSalesPage from './pages/transactions/IndirectSalesPage'
import LoadingDispatchPage from './pages/transactions/LoadingDispatchPage'
import SupplierPaymentPage from './pages/transactions/SupplierPaymentPage'
import LabourAttendancePage from './pages/transactions/LabourAttendancePage'
import CustomerReceiptPage from './pages/transactions/CustomerReceiptPage'
import PurchaseRegisterPage from './pages/reports/PurchaseRegisterPage'
import SalesRegisterPage from './pages/reports/SalesRegisterPage'
import SupplierStatementPage from './pages/reports/SupplierStatementPage'
import CustomerStatementPage from './pages/reports/CustomerStatementPage'
import LabourAttendanceReportPage from './pages/reports/LabourAttendanceReportPage'
import PendingDispatchReportPage from './pages/reports/PendingDispatchReportPage'
import OutstandingReportPage from './pages/reports/OutstandingReportPage'
import BagPurchasePage from './pages/masters/BagPurchasePage'
import OrganizationMasterPage from './pages/masters/OrganizationMasterPage'
import RolesMasterPage from './pages/masters/RolesMasterPage'
import UserMasterPage from './pages/masters/UserMasterPage'
import UserPermissionPage from './pages/masters/UserPermissionPage'
import BranchesMasterPage from './pages/masters/BranchesMasterPage'
import EditProfilePage from './pages/Profile/EditProfilePage'
import ChangePasswordPage from './pages/Profile/ChangePasswordPage'
import RegisterPage from './pages/Auth/RegisterPage'



/**
 * @component RequireAuth
 * @description Auth guard that redirects unauthenticated users to login.
 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

/**
 * @component App
 * @description Root application component configuring routes.
 */
export default function App() {
  return (
    <HashRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
         <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="organization-master" element={<OrganizationMasterPage />} />
          <Route path="masters/roles" element={<RolesMasterPage />} />
          <Route path="masters/users" element={<UserMasterPage />} />
          <Route path="masters/user-permissions" element={<UserPermissionPage />} />
          <Route path="masters/branches" element={<BranchesMasterPage />} />
          <Route path="profile" element={<EditProfilePage />} />
          <Route path="profile/password" element={<ChangePasswordPage />} />

          {/* Masters */}
         
          <Route path="masters/branch-master" element={<BranchMasterPage />} />
          <Route path="masters/items" element={<ItemMasterPage />} />
          <Route path="masters/gunny-bags" element={<GunnyBagMasterPage />} />
          <Route path="masters/suppliers" element={<SupplierMasterPage />} />
          <Route path="masters/customers" element={<CustomerMasterPage />} />
          <Route path="masters/labors" element={<LabourMasterPage />} />
          <Route path="masters/bag-purchase" element={<BagPurchasePage />} />
          

          {/* Transactions */}
          <Route path="transactions/purchase-order" element={<PurchaseOrderPage />} />
          <Route path="transactions/purchase-invoice" element={<PurchaseInvoicePage />} />
          <Route path="transactions/direct-sales" element={<DirectSalesPage />} />
          <Route path="transactions/indirect-sales" element={<IndirectSalesPage />} />
          <Route path="transactions/customer-receipt" element={<CustomerReceiptPage />} />
          <Route path="transactions/loading-dispatch" element={<LoadingDispatchPage />} />
          <Route path="transactions/supplier-payment" element={<SupplierPaymentPage />} />
          <Route path="transactions/labour-attendance" element={<LabourAttendancePage />} />

          {/* Reports */}
          <Route path="reports/purchase-register" element={<PurchaseRegisterPage />} />
          <Route path="reports/sales-register" element={<SalesRegisterPage />} />
          <Route path="reports/supplier-statement" element={<SupplierStatementPage />} />
          <Route path="reports/customer-statement" element={<CustomerStatementPage />} />
          <Route path="reports/labour-attendance" element={<LabourAttendanceReportPage />} />
          <Route path="reports/pending-dispatch" element={<PendingDispatchReportPage />} />
          <Route path="reports/outstanding" element={<OutstandingReportPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  )
}