
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Send, History, Info } from 'lucide-react';
import { useSnapshotManager } from '@/hooks/useSnapshotManager';

interface CommandHistory {
  id: string;
  command: string;
  response: any;
  timestamp: Date;
  success: boolean;
}

export const SnapshotCommandInterface: React.FC = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { executeCommand, isLoading } = useSnapshotManager();

  const availableCommands = [
    { cmd: '!snapshot [setor] "[descrição]"', desc: 'Criar snapshot de um setor' },
    { cmd: '!restore [setor] "[nome do snapshot]"', desc: 'Restaurar snapshot' },
    { cmd: '!list [setor]/all', desc: 'Listar snapshots' },
    { cmd: '!preview restore [setor] "[nome]"', desc: 'Preview de restauração' },
    { cmd: '!check dependencies [setor]', desc: 'Verificar dependências' }
  ];

  const availableSectors = [
    'sidebar', 'header', 'campaigns', 'wizard', 
    'admin', 'integrations', 'dashboard', 'auth'
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleExecuteCommand = async () => {
    if (!command.trim()) return;

    const newHistoryItem: CommandHistory = {
      id: Date.now().toString(),
      command: command.trim(),
      response: null,
      timestamp: new Date(),
      success: false
    };

    try {
      console.log('🎯 Executing command:', command);
      const response = await executeCommand(command.trim());
      
      newHistoryItem.response = response;
      newHistoryItem.success = !response.error;
      
      setHistory(prev => [...prev, newHistoryItem]);
      setCommand('');
      
    } catch (error) {
      newHistoryItem.response = { error: error instanceof Error ? error.message : 'Erro desconhecido' };
      newHistoryItem.success = false;
      setHistory(prev => [...prev, newHistoryItem]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecuteCommand();
    }
  };

  const formatResponse = (response: any) => {
    if (typeof response === 'string') return response;
    
    if (response.error) {
      return `❌ Erro: ${response.error}`;
    }
    
    if (response.message) {
      return response.message;
    }
    
    if (response.formatted) {
      return response.formatted;
    }
    
    if (response.snapshots) {
      return `📦 Encontrados ${response.total} snapshots`;
    }
    
    return JSON.stringify(response, null, 2);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Sistema de Snapshots Setorizado
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="ml-auto"
          >
            <Info className="w-4 h-4 mr-1" />
            Ajuda
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showHelp && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h4 className="font-semibold mb-2">Comandos Disponíveis:</h4>
              <div className="space-y-2 text-sm">
                {availableCommands.map((cmd, index) => (
                  <div key={index} className="flex gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {cmd.cmd}
                    </code>
                    <span className="text-gray-600">- {cmd.desc}</span>
                  </div>
                ))}
              </div>
              
              <h4 className="font-semibold mt-4 mb-2">Setores Disponíveis:</h4>
              <div className="flex flex-wrap gap-1">
                {availableSectors.map(sector => (
                  <Badge key={sector} variant="outline" className="text-xs">
                    {sector}
                  </Badge>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Exemplo:</strong> <code>!snapshot sidebar "menu funcional"</code>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de comandos */}
        <ScrollArea ref={scrollRef} className="h-64 border rounded-md p-4 bg-gray-900 text-gray-100">
          {history.length === 0 ? (
            <div className="text-gray-400 text-sm">
              Digite um comando para começar...
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-400">$</span>
                    <span className="text-white">{item.command}</span>
                    <span className="text-gray-500 text-xs ml-auto">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`text-sm pl-4 whitespace-pre-wrap ${
                    item.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatResponse(item.response)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input de comando */}
        <div className="flex gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite um comando... ex: !list all"
            className="font-mono"
            disabled={isLoading}
          />
          <Button 
            onClick={handleExecuteCommand}
            disabled={isLoading || !command.trim()}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Executar
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          Pressione Enter para executar comandos rapidamente
        </div>
      </CardContent>
    </Card>
  );
};
