import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import Index from "./pages/Index";
import HomeRouterGate from "./components/HomeRouterGate";
import DentistLandingPage from "./pages/landing/DentistLandingPage";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import UsageContract from "./pages/legal/UsageContract";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import EmailConfirmation from "./pages/auth/EmailConfirmation";
import ConfirmEmail from "./pages/auth/ConfirmEmail";
import SetPassword from "./pages/auth/SetPassword";
import MetaCallback from "./pages/auth/MetaCallback";
import MetaCallbackGeneral from "./pages/auth/MetaCallbackGeneral";
import PublicAuthLayout from "./components/layouts/PublicAuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/layouts/AppShell";
import ProvidersPrivados from "./components/ProvidersPrivados";
import PrivateRoutes from "./routes/PrivateRoutes";
import Quiz from "./pages/Quiz";
import SubscriptionPlans from "./pages/subscription/SubscriptionPlans";
import CheckoutPageV5 from "./pages/checkout/index";
import SubscriptionSuccess from "./pages/subscription/SubscriptionSuccess";
import SubscriptionCanceled from "./pages/subscription/SubscriptionCanceled";
import CheckoutSuccess from "./pages/checkout/CheckoutSuccess";
import CheckoutError from "./pages/checkout/CheckoutError";
import AdminPagarme from "./pages/admin/AdminPagarme";
import MonthlyPlanPage from "./pages/plans/MonthlyPlanPage";
import AnnualPlanPage from "./pages/plans/AnnualPlanPage";
import QuizPublic from "./pages/QuizPublic";
import IAPage from "./pages/IAPage";

const queryClient = new QueryClient();

const AppWithRoutes = () => {
  return (
    <Routes>
      {/* ROTAS PÚBLICAS (NÃO montar providers do app aqui) */}
      <Route path="/auth/*" element={<PublicAuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="email-confirmation" element={<EmailConfirmation />} />
        <Route path="confirm-email" element={<ConfirmEmail />} />
        <Route path="set-password" element={<SetPassword />} />
        <Route path="meta-callback" element={<MetaCallback />} />
        <Route path="callback/meta" element={<MetaCallbackGeneral />} />
      </Route>

      {/* Outras rotas públicas */}
      <Route path="/landing" element={<Index />} />
      <Route path="/dentistas" element={<DentistLandingPage />} />
      <Route path="/legal/terms" element={<TermsOfService />} />
      <Route path="/legal/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal/contrato" element={<UsageContract />} />
      <Route path="/quiz" element={<Quiz />} />
      
      {/* Subscription routes - public */}
      <Route path="/assinatura" element={<SubscriptionPlans />} />
      <Route path="/assinatura/checkout" element={<CheckoutPageV5 />} />
      <Route path="/assinatura/sucesso" element={<SubscriptionSuccess />} />
      <Route path="/assinatura/cancelada" element={<SubscriptionCanceled />} />
      
      {/* Checkout routes - public */}
      <Route path="/checkout" element={<CheckoutPageV5 />} />
      <Route path="/checkout/sucesso" element={<CheckoutSuccess />} />
      <Route path="/checkout/erro" element={<CheckoutError />} />
      
      {/* Plan pages - public */}
      <Route path="/plano-mensal" element={<MonthlyPlanPage />} />
      <Route path="/plano-anual" element={<AnnualPlanPage />} />

      {/* Quiz public pages */}
      <Route path="/quizz/:slug" element={<QuizPublic />} />

      {/* IA page - public */}
      <Route path="/ia" element={<IAPage />} />

      {/* LANDING PAGE - acessível para todos */}
      <Route path="/" element={<Index />} />
      
      {/* GATE decide para onde mandar (login / reset / dashboard) */}
      <Route path="/app" element={<HomeRouterGate />} />

      {/* ROTAS PRIVADAS (só aqui montamos providers do app) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProvidersPrivados>
                <PrivateRoutes />
              </ProvidersPrivados>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppWithRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
