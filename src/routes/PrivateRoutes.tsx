import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminRoute from '@/components/AdminRoute';
import { Loader2 } from 'lucide-react';

// ── Lazy loading fallback ───────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// ── Dashboard pages (eagerly loaded) ────────────────────────────────────────
import Dashboard from '@/pages/dashboard/Dashboard';
import Campaigns from '@/pages/dashboard/Campaigns';
import SimpleCampaignWizardPage from '@/pages/dashboard/SimpleCampaignWizard';
import SimpleCampaignListPage from '@/pages/dashboard/SimpleCampaignList';
import SimpleCampaignInsightsPage from '@/pages/dashboard/SimpleCampaignInsights';
import Media from '@/pages/dashboard/Media';
import AdvantageCampaignPage from '@/pages/dashboard/AdvantageCampaign';
import CreateCampaign from '@/pages/dashboard/CreateCampaign';
import MyBusiness from '@/pages/dashboard/MyBusiness';
import AdvancedAnalytics from '@/pages/dashboard/AdvancedAnalytics';
import AdSetVerification from '@/pages/dashboard/AdSetVerification';
import SubscriptionPageDashboard from '@/pages/dashboard/SubscriptionPage';
import Integrations from '@/pages/dashboard/Integrations';
import Tutorials from '@/pages/dashboard/Tutorials';
import Guides from '@/pages/dashboard/Guides';
import Support from '@/pages/dashboard/Support';
import StrategyReports from '@/pages/dashboard/StrategyReports';
import StrategyReportView from '@/pages/dashboard/StrategyReportView';
import Notifications from '@/pages/dashboard/Notifications';
import Settings from '@/pages/dashboard/Settings';
import { CampaignPage } from '@/pages/CampaignPage';

// ── Phase 6: Lazy loaded pages (monitoring + admin) ─────────────────────────
const Monitoring = React.lazy(() => import('@/pages/dashboard/Monitoring'));

// Onboarding Pages
import Welcome from '@/pages/onboarding/Welcome';
import PlanSelection from '@/pages/onboarding/PlanSelection';
import TrialStarted from '@/pages/onboarding/TrialStarted';

// Checkout Pages
import CheckoutSuccess from '@/pages/checkout/Success';
import CheckoutCancel from '@/pages/checkout/Cancel';
import CheckoutParcelado from '@/pages/checkout/Parcelado';
import ParceladoExample from '@/pages/checkout/ParceladoExample';

// Integration Pages
import MetaIntegrationSuccess from '@/pages/integrations/MetaIntegrationSuccess';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminSubscriptions from '@/pages/admin/AdminSubscriptions';
import AdminLeads from '@/pages/admin/AdminLeads';
import AdminSectors from '@/pages/admin/AdminSectors';
import AdminLearning from '@/pages/admin/AdminLearning';
import AdminMetaAds from '@/pages/admin/AdminMetaAds';
import AdminPagarme from '@/pages/admin/AdminPagarme';
import AdminAsaas from '@/pages/admin/AdminAsaas';
import PaymentsIntegration from '@/pages/admin/PaymentsIntegration';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminAIMonitoring from '@/pages/admin/AdminAIMonitoring';
import AdminClientBusinesses from '@/pages/admin/AdminClientBusinesses';
import AdminClientCampaigns from '@/pages/admin/AdminClientCampaigns';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminOpenAI from '@/pages/admin/AdminOpenAI';
import AdminAIMedia from '@/pages/admin/AdminAIMedia';
import AdminCampaignProfiles from '@/pages/admin/AdminCampaignProfiles';
import MapboxSettings from '@/pages/admin/MapboxSettings';
import PlansAdmin from '@/pages/admin/PlansAdmin';
import MetaTestLab from '@/pages/admin/MetaTestLab';
import AdminContingency from '@/pages/admin/AdminContingency';
import AdminCustomReport from '@/pages/admin/AdminCustomReport';
import AdminQuizzes from '@/pages/admin/AdminQuizzes';
import AdminQuizBuilder from '@/pages/admin/AdminQuizBuilder';
import AdminQuizLeads from '@/pages/admin/AdminQuizLeads';
import AdminQuizLeadDetail from '@/pages/admin/AdminQuizLeadDetail';

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
          <Route path="campaign/:id" element={<CampaignPage />} />
          <Route path="simple-campaign-wizard" element={<SimpleCampaignWizardPage />} />
          <Route path="simple-campaign-list" element={<SimpleCampaignListPage />} />
          <Route path="simple-campaign-insights/:campaignId" element={<SimpleCampaignInsightsPage />} />
          <Route path="media" element={<Media />} />
          <Route path="advantage-campaign" element={<AdvantageCampaignPage />} />
          <Route path="create-campaign" element={<CreateCampaign />} />
          <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="adset-verification" element={<AdSetVerification />} />
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
          <Route path="campaign-profiles" element={<AdminCampaignProfiles />} />
          <Route path="meta-test-lab" element={<MetaTestLab />} />
          <Route path="contingency" element={<AdminContingency />} />
          <Route path="custom-report" element={<AdminCustomReport />} />
          <Route path="quizzes" element={<AdminQuizzes />} />
          <Route path="quizzes/new" element={<AdminQuizBuilder />} />
          <Route path="quizzes/:id/edit" element={<AdminQuizBuilder />} />
          <Route path="quizzes/:quizId/leads" element={<AdminQuizLeads />} />
          <Route path="quizzes/:quizId/leads/:leadId" element={<AdminQuizLeadDetail />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="settings/mapbox" element={<MapboxSettings />} />
        </Route>

        {/* Legacy Routes - Redirect to dashboard */}
        <Route path="/campaigns" element={<Navigate to="/dashboard/campaigns" replace />} />
        <Route path="/campaign/:id" element={<Navigate to="/dashboard/campaign/:id" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        <Route path="/subscription" element={<Navigate to="/dashboard/subscription" replace />} />
      </Routes>
    </Suspense>
  );
};

export default PrivateRoutes;