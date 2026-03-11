import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Crown, X } from 'lucide-react';
import { useTrialPeriod } from '@/hooks/useTrialPeriod';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TrialBannerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onDismiss, showDismiss = false }) => {
  // 🚫 COMPONENTE COMPLETAMENTE DESATIVADO
  // Não exibir banner de trial/assinatura em nenhuma circunstância
  return null;
};