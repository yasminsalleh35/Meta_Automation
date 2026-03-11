
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { LearningContentDisplay } from '@/components/learning/LearningContentDisplay';

const Tutorials: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tutoriais</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Centro de Aprendizado
            </CardTitle>
            <CardDescription>
              Aprenda a usar a plataforma com nossos tutoriais e vídeos
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Conteúdos reais do banco de dados */}
        <LearningContentDisplay 
          contentType="video"
          title="Vídeos e Tutoriais"
        />
      </div>
    </div>
  );
};

export default Tutorials;
