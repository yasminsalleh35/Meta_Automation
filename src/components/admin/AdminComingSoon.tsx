import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface AdminComingSoonProps {
  title: string;
  description: string;
}

// ADM-05: páginas do admin que mostravam números fictícios agora exibem "em breve".
export const AdminComingSoon: React.FC<AdminComingSoonProps> = ({ title, description }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Badge variant="secondary">Em breve</Badge>
    </div>
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-lg font-medium">Esta área ainda está em desenvolvimento.</p>
        <p className="text-muted-foreground max-w-xl mx-auto">{description}</p>
      </CardContent>
    </Card>
  </div>
);
