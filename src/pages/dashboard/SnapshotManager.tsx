
import React, { useState } from 'react';
import { SnapshotCommandInterface } from '@/components/snapshot/SnapshotCommandInterface';
import { AutoSnapshotExecutor } from '@/components/snapshot/AutoSnapshotExecutor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Shield, Zap, Database, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SnapshotManager: React.FC = () => {
  const [autoCommandResult, setAutoCommandResult] = useState<any>(null);
  const [showAutoExecutor, setShowAutoExecutor] = useState(true);

  // Execute the requested snapshot command automatically
  const handleAutoCommandComplete = (result: any) => {
    setAutoCommandResult(result);
    setShowAutoExecutor(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Gerenciador de Snapshots</h1>
        <p className="text-gray-600">
          Sistema de versionamento setorizado para backup e restauração de funcionalidades
        </p>
      </div>

      {/* Auto-execute the snapshot command */}
      {showAutoExecutor && (
        <AutoSnapshotExecutor 
          command='!snapshot sidebar "menu funcional com todas as opções"'
          onComplete={handleAutoCommandComplete}
        />
      )}

      {/* Show result of auto-executed command */}
      {autoCommandResult && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {autoCommandResult.error ? (
              `❌ Erro: ${autoCommandResult.error}`
            ) : (
              `✅ Snapshot do sidebar criado com sucesso! ${autoCommandResult.message || ''}`
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Informações do sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Camera className="w-8 h-8 text-blue-600" />
            <div>
              <div className="font-semibold">Snapshots</div>
              <div className="text-sm text-gray-600">Versionamento por setor</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-semibold">Segurança</div>
              <div className="text-sm text-gray-600">Backups automáticos</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Zap className="w-8 h-8 text-yellow-600" />
            <div>
              <div className="font-semibold">Restauração</div>
              <div className="text-sm text-gray-600">Rápida e seletiva</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Database className="w-8 h-8 text-purple-600" />
            <div>
              <div className="font-semibold">8 Setores</div>
              <div className="text-sm text-gray-600">Independentes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface de comandos */}
      <SnapshotCommandInterface />

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🎯 Setores Disponíveis</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li><strong>sidebar:</strong> Menu lateral e navegação</li>
                <li><strong>header:</strong> Cabeçalhos das páginas</li>
                <li><strong>campaigns:</strong> Sistema completo de campanhas</li>
                <li><strong>wizard:</strong> Assistente de criação</li>
                <li><strong>admin:</strong> Painel administrativo</li>
                <li><strong>integrations:</strong> Integrações com Meta Ads</li>
                <li><strong>dashboard:</strong> Página principal</li>
                <li><strong>auth:</strong> Sistema de autenticação</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚡ Recursos</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• <strong>Versionamento independente</strong> por setor</li>
                <li>• <strong>Backup automático</strong> antes de restaurações</li>
                <li>• <strong>Verificação de dependências</strong> entre setores</li>
                <li>• <strong>Preview de restauração</strong> antes de aplicar</li>
                <li>• <strong>Histórico completo</strong> de operações</li>
                <li>• <strong>Interface por comandos</strong> intuitiva</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SnapshotManager;
