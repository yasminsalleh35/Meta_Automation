
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Send, Users, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { useRealNotifications } from '@/hooks/useRealNotifications';
import { Checkbox } from '@/components/ui/checkbox';

const AdminNotifications: React.FC = () => {
  const { notifications, isLoading, createNotification, markAsRead, deleteNotification, sendBulkNotification } = useRealNotifications();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkNotificationData, setBulkNotificationData] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  const handleCreateNotification = async () => {
    if (selectedUsers.length > 0 && bulkNotificationData.title && bulkNotificationData.message) {
      await sendBulkNotification(
        selectedUsers,
        bulkNotificationData.title,
        bulkNotificationData.message,
        bulkNotificationData.type
      );
      setShowCreateDialog(false);
      setBulkNotificationData({ title: '', message: '', type: 'info' });
      setSelectedUsers([]);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: notifications.length,
    read: notifications.filter(n => n.read).length,
    unread: notifications.filter(n => !n.read).length,
    recent: notifications.filter(n => {
      const notifDate = new Date(n.created_at);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return notifDate > dayAgo;
    }).length
  };

  if (isLoading) {
    return <div className="p-6">Carregando notificações...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-indigo-600/20 backdrop-blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Bell className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  Gerenciar Notificações
                </h1>
                <p className="text-purple-100 text-lg">Enviar e gerenciar notificações dos usuários</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Notificação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Notificações</CardTitle>
          <CardDescription>
            {notifications.length} notificação(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">{notification.title}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(notification.type)}>
                      {notification.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={notification.read ? "default" : "secondary"}>
                      {notification.read ? 'Lida' : 'Não lida'}
                    </Badge>
                  </TableCell>
                  <TableCell>{notification.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    {new Date(notification.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
            <DialogDescription>
              Envie uma notificação para usuários específicos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <Input
                value={bulkNotificationData.title}
                onChange={(e) => setBulkNotificationData({
                  ...bulkNotificationData,
                  title: e.target.value
                })}
                placeholder="Título da notificação"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Mensagem</label>
              <Textarea
                value={bulkNotificationData.message}
                onChange={(e) => setBulkNotificationData({
                  ...bulkNotificationData,
                  message: e.target.value
                })}
                placeholder="Conteúdo da notificação"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select
                value={bulkNotificationData.type}
                onValueChange={(value) => setBulkNotificationData({
                  ...bulkNotificationData,
                  type: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">IDs dos Usuários (separados por vírgula)</label>
              <Textarea
                value={selectedUsers.join(', ')}
                onChange={(e) => setSelectedUsers(
                  e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                )}
                placeholder="uuid1, uuid2, uuid3..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateNotification}>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
