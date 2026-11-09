import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminRoute from '@/components/AdminRoute';
import { PageLoader } from '@/components/PageLoader';
import { FEATURE_ADVANCED_ANALYTICS } from '@/lib/featureFlags';

// ── audit PLT-04: every page is code-split (React.lazy); the layouts wrap <Outlet/> in Suspense ──
// ── Dashboard pages ──────────────────────────────────────────────────────────
const Dashboard = React.lazy(() => import('@/pages/dashboard/Dashboard'));
const Campaigns = React.lazy(() => import('@/pages/dashboard/Campaigns'));
const SimpleCampaignWizardPage = React.lazy(() => import('@/pages/dashboard/SimpleCampaignWizard'));
const SimpleCampaignListPage = React.lazy(() => import('@/pages/dashboard/SimpleCampaignList'));
const SimpleCampaignInsightsPage = React.lazy(() => import('@/pages/dashboard/SimpleCampaignInsights'));
const Media = React.lazy(() => import('@/pages/dashboard/Media'));
const AdvantageCampaignPage = React.lazy(() => import('@/pages/dashboard/AdvantageCampaign'));
const MyBusiness = React.lazy(() => import('@/pages/dashboard/MyBusiness'));
const AdvancedAnalytics = React.lazy(() => import('@/pages/dashboard/AdvancedAnalytics'));
const AdSetVerification = React.lazy(() => import('@/pages/dashboard/AdSetVerification'));
const SubscriptionPageDashboard = React.lazy(() => import('@/pages/dashboard/SubscriptionPage'));
const Integrations = React.lazy(() => import('@/pages/dashboard/Integrations'));
const Tutorials = React.lazy(() => import('@/pages/dashboard/Tutorials'));
const Guides = React.lazy(() => import('@/pages/dashboard/Guides'));
const Support = React.lazy(() => import('@/pages/dashboard/Support'));
const StrategyReports = React.lazy(() => import('@/pages/dashboard/StrategyReports'));
const StrategyReportView = React.lazy(() => import('@/pages/dashboard/StrategyReportView'));
const Notifications = React.lazy(() => import('@/pages/dashboard/Notifications'));
const Settings = React.lazy(() => import('@/pages/dashboard/Settings'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const IntegrationTutorial = React.lazy(() =>
  import('@/components/admin/meta-ads/IntegrationTutorial').then((m) => ({ default: m.IntegrationTutorial }))
);

// CampaignPage is a stub; send campaign detail links to the insights page with the real id.
const CampaignInsightsRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/dashboard/simple-campaign-insights/${id}` : '/dashboard/campaigns'} replace />;
};

// ── Monitoring + edge logs ───────────────────────────────────────────────────
const Monitoring = React.lazy(() => import('@/pages/dashboard/Monitoring'));
const AdminEdgeLogs = React.lazy(() => import('@/pages/admin/AdminEdgeLogs'));

// Onboarding Pages
const Welcome = React.lazy(() => import('@/pages/onboarding/Welcome'));
const PlanSelection = React.lazy(() => import('@/pages/onboarding/PlanSelection'));
const TrialStarted = React.lazy(() => import('@/pages/onboarding/TrialStarted'));

// Checkout Pages
const CheckoutSuccess = React.lazy(() => import('@/pages/checkout/Success'));
const CheckoutCancel = React.lazy(() => import('@/pages/checkout/Cancel'));
const CheckoutParcelado = React.lazy(() => import('@/pages/checkout/Parcelado'));
const ParceladoExample = React.lazy(() => import('@/pages/checkout/ParceladoExample'));

// Integration Pages
const MetaIntegrationSuccess = React.lazy(() => import('@/pages/integrations/MetaIntegrationSuccess'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('@/pages/admin/AdminUsers'));
const AdminSubscriptions = React.lazy(() => import('@/pages/admin/AdminSubscriptions'));
const AdminLeads = React.lazy(() => import('@/pages/admin/AdminLeads'));
const AdminSectors = React.lazy(() => import('@/pages/admin/AdminSectors'));
const AdminLearning = React.lazy(() => import('@/pages/admin/AdminLearning'));
const AdminMetaAds = React.lazy(() => import('@/pages/admin/AdminMetaAds'));
const AdminPagarme = React.lazy(() => import('@/pages/admin/AdminPagarme'));
const AdminAsaas = React.lazy(() => import('@/pages/admin/AdminAsaas'));
const PaymentsIntegration = React.lazy(() => import('@/pages/admin/PaymentsIntegration'));
const AdminSettings = React.lazy(() => import('@/pages/admin/AdminSettings'));
const AdminAIMonitoring = React.lazy(() => import('@/pages/admin/AdminAIMonitoring'));
const AdminClientBusinesses = React.lazy(() => import('@/pages/admin/AdminClientBusinesses'));
const AdminClientCampaigns = React.lazy(() => import('@/pages/admin/AdminClientCampaigns'));
const AdminNotifications = React.lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminOpenAI = React.lazy(() => import('@/pages/admin/AdminOpenAI'));
const AdminAIMedia = React.lazy(() => import('@/pages/admin/AdminAIMedia'));
const AdminCampaignProfiles = React.lazy(() => import('@/pages/admin/AdminCampaignProfiles'));
const MapboxSettings = React.lazy(() => import('@/pages/admin/MapboxSettings'));
const PlansAdmin = React.lazy(() => import('@/pages/admin/PlansAdmin'));
const MetaTestLab = React.lazy(() => import('@/pages/admin/MetaTestLab'));
const AdminContingency = React.lazy(() => import('@/pages/admin/AdminContingency'));
const AdminCustomReport = React.lazy(() => import('@/pages/admin/AdminCustomReport'));
const AdminQuizzes = React.lazy(() => import('@/pages/admin/AdminQuizzes'));
const AdminQuizBuilder = React.lazy(() => import('@/pages/admin/AdminQuizBuilder'));
const AdminQuizLeads = React.lazy(() => import('@/pages/admin/AdminQuizLeads'));
const AdminQuizLeadDetail = React.lazy(() => import('@/pages/admin/AdminQuizLeadDetail'));

const PrivateRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Onboarding Routes */}
        <Route path="/onboarding/*">
          <Route path="welcome" element={<Welcome />} />
          <Route path="plan-selection" element={<PlanSelection />} />
          <Route path="trial-started" element={<TrialStarted />} />
        </Route>

        {/* Checkout Routes */}
        <Route path="/checkout/*">
          <Route path="success" element={<CheckoutSuccess />} />
          <Route path="cancel" element={<CheckoutCancel />} />
          <Route path="parcelado" element={<CheckoutParcelado />} />
          <Route path="parcelado-example" element={<ParceladoExample />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaign/:id" element={<CampaignInsightsRedirect />} />
          <Route path="campaigns/:id" element={<CampaignInsightsRedirect />} />
          <Route path="simple-campaign-wizard" element={<SimpleCampaignWizardPage />} />
          <Route path="simple-campaign-list" element={<SimpleCampaignListPage />} />
          <Route path="simple-campaign-insights/:campaignId" element={<SimpleCampaignInsightsPage />} />
          <Route path="media" element={<Media />} />
          {/* audit CMP-12: legacy wizard retired; demo pages moved under /admin */}
          <Route path="create-campaign" element={<Navigate to="/dashboard/simple-campaign-wizard" replace />} />
          <Route path="campaigns/create" element={<Navigate to="/dashboard/simple-campaign-wizard" replace />} />
          {/* audit DATA-01: hidden behind a feature flag until the page uses real data */}
          <Route
            path="advanced-analytics"
            element={FEATURE_ADVANCED_ANALYTICS ? <AdvancedAnalytics /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="integrations/meta-success" element={<MetaIntegrationSuccess />} />
          <Route path="tutorials" element={<Tutorials />} />
          <Route path="guides" element={<Guides />} />
          <Route path="support" element={<Support />} />
          <Route path="my-business" element={<MyBusiness />} />
          <Route path="strategy-report" element={<StrategyReports />} />
          <Route path="strategy-report/:id" element={<StrategyReportView />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="subscription" element={<SubscriptionPageDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="plans" element={<PlansAdmin />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="sectors" element={<AdminSectors />} />
          <Route path="learning" element={<AdminLearning />} />
          <Route path="client-businesses" element={<AdminClientBusinesses />} />
          <Route path="client-campaigns" element={<AdminClientCampaigns />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="ai-integration" element={<AdminOpenAI />} />
          <Route path="ai-media" element={<AdminAIMedia />} />
          <Route path="ai-monitoring" element={<AdminAIMonitoring />} />
          <Route path="integrations/payments" element={<PaymentsIntegration />} />
          <Route path="integrations/stripe" element={<Navigate to="/admin/integrations/payments" replace />} />
          <Route path="integrations/pagarme" element={<AdminPagarme />} />
          <Route path="integrations/asaas" element={<AdminAsaas />} />
          <Route path="integrations/meta-ads" element={<AdminMetaAds />} />
          <Route path="integrations/meta-ads-tutorial" element={<IntegrationTutorial />} />
          <Route path="advantage-campaign" element={<AdvantageCampaignPage />} />
          <Route path="adset-verification" element={<AdSetVerification />} />
          <Route path="campaign-profiles" element={<AdminCampaignProfiles />} />
          <Route path="meta-test-lab" element={<MetaTestLab />} />
          <Route path="contingency" element={<AdminContingency />} />
          <Route path="custom-report" element={<AdminCustomReport />} />
          <Route path="quizzes" element={<AdminQuizzes />} />
          <Route path="quizzes/new" element={<AdminQuizBuilder />} />
          <Route path="quizzes/:id/edit" element={<AdminQuizBuilder />} />
          <Route path="quizzes/:quizId/leads" element={<AdminQuizLeads />} />
          <Route path="quizzes/:quizId/leads/:leadId" element={<AdminQuizLeadDetail />} />
          <Route path="edge-logs" element={<AdminEdgeLogs />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="settings/mapbox" element={<MapboxSettings />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Legacy Routes - Redirect to dashboard */}
        <Route path="/campaigns" element={<Navigate to="/dashboard/campaigns" replace />} />
        <Route path="/campaign/:id" element={<CampaignInsightsRedirect />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        <Route path="/subscription" element={<Navigate to="/dashboard/subscription" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default PrivateRoutes;