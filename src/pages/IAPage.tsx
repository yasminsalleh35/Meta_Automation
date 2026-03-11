import React, { useState } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { IAHeroSection } from '@/components/ia/IAHeroSection';
import { IAWhyExistsSection } from '@/components/ia/IAWhyExistsSection';
import { IAWhatIsSection } from '@/components/ia/IAWhatIsSection';
import { IAHowItWorksSection } from '@/components/ia/IAHowItWorksSection';
import { IAComparisonSection } from '@/components/ia/IAComparisonSection';
import { IADecisionSection } from '@/components/ia/IADecisionSection';
import { IAEconomySection } from '@/components/ia/IAEconomySection';
import { IANoNeedSection } from '@/components/ia/IANoNeedSection';
import { IAUseCasesSection } from '@/components/ia/IAUseCasesSection';
import { IASecuritySection } from '@/components/ia/IASecuritySection';
import { IASupportSection } from '@/components/ia/IASupportSection';
import { IAFAQSection } from '@/components/ia/IAFAQSection';
import { IACTAFinalSection } from '@/components/ia/IACTAFinalSection';

const IAPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />
      
      <main>
        <IAHeroSection />
        <IAWhyExistsSection />
        <IAWhatIsSection />
        <IAHowItWorksSection />
        <IAComparisonSection />
        <IADecisionSection />
        <IAEconomySection />
        <IANoNeedSection />
        <IAUseCasesSection />
        <IASecuritySection />
        <IASupportSection />
        <IAFAQSection />
        <IACTAFinalSection />
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default IAPage;
