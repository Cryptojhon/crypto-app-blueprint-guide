
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AssetDetail from "./pages/AssetDetail";
import NotFound from "./pages/NotFound";
import WalletManagement from "./pages/WalletManagement";
import ProfileManagement from "./pages/ProfileManagement";
import TransactionHistory from "./pages/TransactionHistory";
import { PortfolioProvider } from "./contexts/PortfolioContext";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLayout from "./components/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <PortfolioProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-signup" element={<AdminSignup />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/asset/:id" element={<RequireAuth><AssetDetail /></RequireAuth>} />
              <Route path="/wallet" element={<RequireAuth><WalletManagement /></RequireAuth>} />
              <Route path="/transactions" element={<RequireAuth><TransactionHistory /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><ProfileManagement /></RequireAuth>} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <RequireAuth adminOnly>
                  <AdminLayout>
                    <Routes>
                      <Route path="/dashboard" element={<AdminDashboard />} />
                      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                  </AdminLayout>
                </RequireAuth>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PortfolioProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
