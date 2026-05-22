import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MealPlans from "@/pages/MealPlans";
import PlanDetail from "@/pages/PlanDetail";
import PlanInvite from "@/pages/PlanInvite";
import Foods from "@/pages/Foods";
import ShoppingLists from "@/pages/ShoppingLists";
import ShoppingListDetail from "@/pages/ShoppingListDetail";
import ShoppingListInvite from "@/pages/ShoppingListInvite";
import PresetMeals from "@/pages/PresetMeals";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/cadastro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/planos" element={<ProtectedRoute><MealPlans /></ProtectedRoute>} />
      <Route path="/planos/:id" element={<ProtectedRoute><PlanDetail /></ProtectedRoute>} />
      <Route path="/alimentos" element={<ProtectedRoute><Foods /></ProtectedRoute>} />
      <Route path="/refeicoes-prontas" element={<ProtectedRoute><PresetMeals /></ProtectedRoute>} />
      <Route path="/convite/:token" element={<ProtectedRoute><PlanInvite /></ProtectedRoute>} />
      <Route path="/listas-compras" element={<ProtectedRoute><ShoppingLists /></ProtectedRoute>} />
      <Route path="/listas-compras/aceitar/:token" element={<ProtectedRoute><ShoppingListInvite /></ProtectedRoute>} />
      <Route path="/listas-compras/:id" element={<ProtectedRoute><ShoppingListDetail /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
