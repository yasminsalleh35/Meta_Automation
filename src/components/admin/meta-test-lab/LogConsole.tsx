import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogEntry {
  type: string;
  message: string;
  timestamp: Date;
}

interface LogConsoleProps {
  logs: LogEntry[];
}

const LogConsole: React.FC<LogConsoleProps> = ({ logs }) => {
  const { toast } = useToast();

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleCopyLogs = () => {
    const logsText = logs
      .map((log) => `[${log.timestamp.toLocaleTimeString()}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logsText);
    toast({
      title: 'Logs copiados',
      description: 'Logs copiados para a área de transferência',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Console de Logs</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleCopyLogs} disabled={logs.length === 0}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum log ainda. Execute uma ação para ver os logs.
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 text-xs font-mono">
                  <span className="text-muted-foreground shrink-0">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={getLogColor(log.type)}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LogConsole;
