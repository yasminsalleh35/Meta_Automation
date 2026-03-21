import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
} from 'lucide-react';
import { useEdgeLogs } from '@/hooks/useEdgeLogs';

const levelConfig: Record<string, { icon: typeof AlertCircle; color: string; label: string }> = {
  error: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Error',
  },
  warn: {
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Info',
  },
};

const AdminEdgeLogs: React.FC = () => {
  const {
    logs,
    stats,
    total,
    loading,
    filterFn,
    setFilterFn,
    filterLevel,
    setFilterLevel,
    page,
    setPage,
    pageSize,
    refresh,
  } = useEdgeLogs();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Edge Functions</h1>
          <p className="text-gray-600">Monitoramento de erros e avisos do backend</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erros (24h)</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.total_errors_24h}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avisos (24h)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.total_warnings_24h}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs (24h)</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_logs_24h}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top error functions */}
      {stats && stats.top_functions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funções com mais erros (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.top_functions.map((fn) => (
                <Badge
                  key={fn.function_name}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => { setFilterFn(fn.function_name); setPage(0); }}
                >
                  {fn.function_name}
                  <span className="ml-1.5 text-red-500">{fn.errors}E</span>
                  {fn.warnings > 0 && <span className="ml-1 text-yellow-500">{fn.warnings}W</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Função</label>
              <Input
                placeholder="Ex: simple-campaign-create"
                value={filterFn}
                onChange={(e) => { setFilterFn(e.target.value); setPage(0); }}
              />
            </div>
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Nível</label>
              <Select value={filterLevel || 'all'} onValueChange={(v) => { setFilterLevel(v === 'all' ? '' : v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterFn(''); setFilterLevel(''); setPage(0); }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Logs recentes
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({total} registros)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado com os filtros atuais.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Nível</TableHead>
                    <TableHead className="w-[180px]">Função</TableHead>
                    <TableHead className="w-[100px]">Stage</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[80px]">ms</TableHead>
                    <TableHead className="w-[130px]">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const config = levelConfig[log.level] || levelConfig.info;
                    const IconComp = config.icon;
                    const isExpanded = expandedId === log.id;

                    return (
                      <React.Fragment key={log.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        >
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] ${config.color}`}>
                              <IconComp className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{log.function_name}</TableCell>
                          <TableCell className="text-xs">{log.stage}</TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate">{log.message}</TableCell>
                          <TableCell className="text-xs">{log.status_code || '-'}</TableCell>
                          <TableCell className="text-xs">{log.duration_ms ?? '-'}</TableCell>
                          <TableCell className="text-xs">{formatTime(log.created_at)}</TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30">
                              <div className="p-3 space-y-2">
                                {log.error_code && (
                                  <div>
                                    <span className="text-xs font-medium">Código: </span>
                                    <Badge variant="outline" className="text-xs">{log.error_code}</Badge>
                                  </div>
                                )}
                                {log.user_id && (
                                  <div className="text-xs">
                                    <span className="font-medium">User ID: </span>
                                    <span className="font-mono">{log.user_id}</span>
                                  </div>
                                )}
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div>
                                    <span className="text-xs font-medium">Detalhes:</span>
                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-48">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEdgeLogs;
