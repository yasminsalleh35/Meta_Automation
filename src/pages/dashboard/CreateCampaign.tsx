
import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import SimplifiedWizardContainer from '@/components/campaign/wizard/SimplifiedWizardContainer';

const CreateCampaign: React.FC = () => {
  return (
    <ErrorBoundary>
      <SimplifiedWizardContainer />
    </ErrorBoundary>
  );
};

export default CreateCampaign;
