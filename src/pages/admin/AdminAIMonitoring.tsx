
import React from 'react';
import { AdminComingSoon } from '@/components/admin/AdminComingSoon';

// ADM-05: a página exibia uptime, latência e erros fictícios (dados fixos no código).
const AdminAIMonitoring = () => (
  <AdminComingSoon
    title="Monitoramento IA"
    description="Aqui você poderá acompanhar disponibilidade, latência e erros reais dos provedores de IA. Enquanto isso, consulte os Logs de Sistema."
  />
);

export default AdminAIMonitoring;
