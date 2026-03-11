
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, X, Settings, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Notifications: React.FC = () => {
  const { 
    notifications, 
    loading, 
    error, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead 
  } = useNotifications();
  const { toast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <X className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'destructive' as const;
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    toast({
      title: "Sucesso",
      description: "Notificação marcada como lida"
    });
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    toast({
      title: "Sucesso",
      description: "Notificação removida"
    });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast({
      title: "Sucesso",
      description: "Todas as notificações foram marcadas como lidas"
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Carregando notificações...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como lidas ({unreadCount})
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Central de Notificações
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Acompanhe todas as atualizações importantes das suas campanhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma notificação encontrada.
              </p>
              <p className="text-sm text-muted-foreground/75 mt-2">
                Você receberá notificações sobre suas campanhas e atividades aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border rounded-lg transition-colors ${
                    !notification.read 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="h-2 w-2 bg-primary rounded-full"></div>
                          )}
                          <Badge variant={getBadgeVariant(notification.type)}>
                            {notification.type === 'warning' && 'Aviso'}
                            {notification.type === 'success' && 'Sucesso'}
                            {notification.type === 'error' && 'Erro'}
                            {notification.type === 'info' && 'Info'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Marcar como lida
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(notification.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
