import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import HomeRouterGate from "./components/HomeRouterGate";
import PublicAuthLayout from "./components/layouts/PublicAuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/layouts/AppShell";
import ProvidersPrivados from "./components/ProvidersPrivados";
import { CookieConsentBanner } from "./components/legal/CookieConsentBanner";
import { PageLoader } from "./components/PageLoader";

// audit PLT-04: páginas carregadas sob demanda (React.lazy) — o bundle inicial só leva o shell.
const Index = lazy(() => import("./pages/Index"));
const DentistLandingPage = lazy(() => import("./pages/landing/DentistLandingPage"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const UsageContract = lazy(() => import("./pages/legal/UsageContract"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const EmailConfirmation = lazy(() => import("./pages/auth/EmailConfirmation"));
const ConfirmEmail = lazy(() => import("./pages/auth/ConfirmEmail"));
const SetPassword = lazy(() => import("./pages/auth/SetPassword"));
const MetaCallback = lazy(() => import("./pages/auth/MetaCallback"));
const PrivateRoutes = lazy(() => import("./routes/PrivateRoutes"));
const Quiz = lazy(() => import("./pages/Quiz"));
const SubscriptionPlans = lazy(() => import("./pages/subscription/SubscriptionPlans"));
const CheckoutPageV5 = lazy(() => import("./pages/checkout/index"));
const SubscriptionSuccess = lazy(() => import("./pages/subscription/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("./pages/subscription/SubscriptionCanceled"));
const CheckoutSuccess = lazy(() => import("./pages/checkout/CheckoutSuccess"));
const CheckoutError = lazy(() => import("./pages/checkout/CheckoutError"));
const MonthlyPlanPage = lazy(() => import("./pages/plans/MonthlyPlanPage"));
const AnnualPlanPage = lazy(() => import("./pages/plans/AnnualPlanPage"));
const QuizPublic = lazy(() => import("./pages/QuizPublic"));
const IAPage = lazy(() => import("./pages/IAPage"));

const queryClient = new QueryClient();

const AppWithRoutes = () => {
  return (
    <Suspense fallback={<PageLoader fullScreen />}>
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
        {/* audit SEC-14: rota antiga → mesma página com validação de state (one-time, no servidor) */}
        <Route path="callback/meta" element={<MetaCallback />} />
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
    </Suspense>
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
            {/* audit LGL-02: consentimento de cookies em todas as rotas */}
            <CookieConsentBanner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
