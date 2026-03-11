
import React from 'react';
import { AdSetVerificationDashboard } from '@/components/campaign/AdSetVerificationDashboard';

const AdSetVerification: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Verificação de Ad Sets</h1>
        <p className="text-gray-600 mt-2">
          Monitore e gerencie a verificação automática dos seus Ad Sets do Meta Ads
        </p>
      </div>
      
      <AdSetVerificationDashboard />
    </div>
  );
};

export default AdSetVerification;
