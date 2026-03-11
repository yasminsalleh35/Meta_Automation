
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { MetaCertificationsSection } from '@/components/landing/MetaCertificationsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Landing page acessível para todos - removido redirect automático

  const handleDemoClick = () => {
    const featuresSection = document.querySelector('[data-section="features"]');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <HeroSection onDemoClick={handleDemoClick} />
      <ProblemSection />
      <ComparisonTable />
      <HowItWorksSection />
      <FeaturesSection />
      <MetaCertificationsSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Index;
