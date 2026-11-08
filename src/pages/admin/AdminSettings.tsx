
import React from 'react';
import { AdminComingSoon } from '@/components/admin/AdminComingSoon';

// ADM-05: os botões desta página (modo manutenção, logs etc.) não tinham ação.
const AdminSettings: React.FC = () => (
  <AdminComingSoon
    title="Configurações Admin"
    description="As configurações globais do sistema ainda não estão disponíveis pelo painel. Para logs, use Logs de Sistema; para mapas, Configurações Mapbox."
  />
);

export default AdminSettings;
