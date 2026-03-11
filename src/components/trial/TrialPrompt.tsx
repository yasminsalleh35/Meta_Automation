import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { useTrialPeriod } from '@/hooks/useTrialPeriod';
import { useUserRole } from '@/hooks/useUserRole';

interface TrialPromptProps {
  variant?: 'card' | 'modal' | 'inline';
  showFeatures?: boolean;
  onClose?: () => void;
}

export const TrialPrompt: React.FC<TrialPromptProps> = ({ 
  variant = 'card', 
  showFeatures = true,
  onClose
}) => {
  // 🚫 COMPONENTE COMPLETAMENTE DESATIVADO
  // Não exibir prompts de trial/assinatura em nenhuma circunstância
  return null;
};