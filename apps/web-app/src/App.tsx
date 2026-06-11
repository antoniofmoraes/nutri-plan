import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingState, FullScreenLoading } from "@/components/shared/LoadingState";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const MealPlans = lazy(() => import("@/pages/MealPlans"));
const PlanDetail = lazy(() => import("@/pages/PlanDetail"));
const PlanInvite = lazy(() => import("@/pages/PlanInvite"));
const Foods = lazy(() => import("@/pages/Foods"));
const ShoppingLists = lazy(() => import("@/pages/ShoppingLists"));
const ShoppingListDetail = lazy(() => import("@/pages/ShoppingListDetail"));
const ShoppingListInvite = lazy(() => import("@/pages/ShoppingListInvite"));
const PresetMeals = lazy(() => import("@/pages/PresetMeals"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  return (
    <MainLayout>
      <Suspense fallback={<LoadingState />}>{children}</Suspense>
    </MainLayout>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoading />;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Suspense fallback={<FullScreenLoading />}>{children}</Suspense>;
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
      <Route path="*" element={<Suspense fallback={<FullScreenLoading />}><NotFound /></Suspense>} />
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
