
import React from 'react';
import { Navigate } from 'react-router-dom';

const SimpleCampaignListPage: React.FC = () => {
  return <Navigate to="/dashboard/campaigns" replace />;
};

export default SimpleCampaignListPage;
