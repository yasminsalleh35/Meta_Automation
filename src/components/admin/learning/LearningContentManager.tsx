
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Video, HelpCircle, TrendingUp } from 'lucide-react';
import { useSupabaseLearningContent } from '@/hooks/useSupabaseLearningContent';

// Importar o tipo para evitar erros
type SupplementaryMaterial = {
  title: string;
  type: 'pdf' | 'link' | 'document' | 'other';
  url: string;
  description?: string;
};

export const LearningContentManager: React.FC = () => {
  const {
    categories,
    contents,
    isLoading,
    createContent,
    updateContent,
    deleteContent,
    togglePublish,
    loadContents,
    isYouTubeUrl,
    extractYouTubeThumbnail
  } = useSupabaseLearningContent();

  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'guide' as 'video' | 'guide' | 'article' | 'tutorial',
    content_url: '',
    thumbnail_url: '',
    category_id: '',
    duration_minutes: 0,
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    tags: [] as string[],
    is_published: false,
    is_featured: false,
    sort_order: 0,
    supplementary_material: [] as SupplementaryMaterial[]
  });
  
  const [supplementaryMaterialInput, setSupplementaryMaterialInput] = useState({
    title: '',
    type: 'pdf' as 'pdf' | 'link' | 'document' | 'other',
    url: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-extrair thumbnail do YouTube se não fornecida
    let thumbnailUrl = formData.thumbnail_url;
    if (!thumbnailUrl && formData.content_url && isYouTubeUrl(formData.content_url)) {
      const extracted = extractYouTubeThumbnail(formData.content_url);
      if (extracted) {
        thumbnailUrl = extracted;
      }
    }
    
    const contentData = {
      ...formData,
      thumbnail_url: thumbnailUrl,
      category_id: formData.category_id || null,
      duration_minutes: formData.duration_minutes || null
    };

    try {
      if (editingContent) {
        await updateContent(editingContent.id, contentData);
      } else {
        await createContent(contentData);
      }
      resetForm();
      // Recarregar conteúdos para mostrar todos (publicados e não publicados) no admin
      loadContents();
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const togglePublishStatus = async (content: any) => {
    await togglePublish(content.id, !content.is_published);
  };

  const editContent = (content: any) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description || '',
      content_type: content.content_type,
      content_url: content.content_url || '',
      thumbnail_url: content.thumbnail_url || '',
      category_id: content.category_id || '',
      duration_minutes: content.duration_minutes || 0,
      difficulty_level: content.difficulty_level,
      tags: content.tags || [],
      is_published: content.is_published,
      is_featured: content.is_featured,
      sort_order: content.sort_order || 0,
      supplementary_material: content.supplementary_material || []
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'guide',
      content_url: '',
      thumbnail_url: '',
      category_id: '',
      duration_minutes: 0,
      difficulty_level: 'beginner',
      tags: [],
      is_published: false,
      is_featured: false,
      sort_order: 0,
      supplementary_material: []
    });
    setSupplementaryMaterialInput({
      title: '',
      type: 'pdf',
      url: '',
      description: ''
    });
    setEditingContent(null);
    setShowForm(false);
  };

  const addSupplementaryMaterial = () => {
    if (supplementaryMaterialInput.title && supplementaryMaterialInput.url) {
      setFormData(prev => ({
        ...prev,
        supplementary_material: [...prev.supplementary_material, supplementaryMaterialInput]
      }));
      setSupplementaryMaterialInput({
        title: '',
        type: 'pdf',
        url: '',
        description: ''
      });
    }
  };

  const removeSupplementaryMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      supplementary_material: prev.supplementary_material.filter((_, i) => i !== index)
    }));
  };

  const getContentTypeLabel = (type: string) => {
    const types = {
      video: 'Vídeo',
      guide: 'Guia',
      article: 'Artigo',
      tutorial: 'Tutorial'
    };
    return types[type as keyof typeof types] || type;
  };

  const getContentTypeIcon = (type: string) => {
    const icons = {
      video: Video,
      guide: BookOpen,
      article: BookOpen,
      tutorial: HelpCircle
    };
    const Icon = icons[type as keyof typeof icons] || BookOpen;
    return <Icon className="w-4 h-4" />;
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Centro de Aprendizado</h2>
          <p className="text-gray-600">Gerencie vídeos, guias, artigos e tutoriais</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Conteúdo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingContent ? 'Editar Conteúdo' : 'Novo Conteúdo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Conteúdo</label>
                  <Select 
                    value={formData.content_type} 
                    onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guide">Guia</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="article">Artigo</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nível de Dificuldade</label>
                  <Select 
                    value={formData.difficulty_level} 
                    onValueChange={(value: any) => setFormData({ ...formData, difficulty_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">URL do Conteúdo</label>
                  <Input
                    value={formData.content_url}
                    onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL da Thumbnail</label>
                  <Input
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duração (minutos)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ordem de Exibição</label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2 pt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    />
                    <label htmlFor="is_published" className="text-sm font-medium">
                      Publicar
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium">
                      Destacar
                    </label>
                  </div>
                </div>
              </div>

              {/* Material Complementar */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Material Complementar</h4>
                
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Título do material"
                    value={supplementaryMaterialInput.title}
                    onChange={(e) => setSupplementaryMaterialInput({ ...supplementaryMaterialInput, title: e.target.value })}
                  />
                  <Select 
                    value={supplementaryMaterialInput.type} 
                    onValueChange={(value: 'pdf' | 'link' | 'document' | 'other') => setSupplementaryMaterialInput({ ...supplementaryMaterialInput, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="URL do material"
                    value={supplementaryMaterialInput.url}
                    onChange={(e) => setSupplementaryMaterialInput({ ...supplementaryMaterialInput, url: e.target.value })}
                  />
                  <Button type="button" onClick={addSupplementaryMaterial}>
                    Adicionar
                  </Button>
                </div>

                {formData.supplementary_material.length > 0 && (
                  <div className="space-y-2">
                    {formData.supplementary_material.map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{material.title}</span>
                          <Badge variant="outline" className="ml-2">{material.type}</Badge>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeSupplementaryMaterial(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingContent ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conteúdos Existentes</CardTitle>
          <CardDescription>
            {contents.length} conteúdo(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visualizações</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getContentTypeIcon(content.content_type)}
                      <div>
                        <span>{content.title}</span>
                        {content.is_featured && (
                          <Badge variant="secondary" className="ml-2">Destacado</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {content.category?.name || 'Sem categoria'}
                  </TableCell>
                  <TableCell>{getContentTypeLabel(content.content_type)}</TableCell>
                  <TableCell>
                    <Badge variant={content.is_published ? "default" : "secondary"}>
                      {content.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell>{content.view_count}</TableCell>
                  <TableCell>
                    {new Date(content.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublishStatus(content)}
                      >
                        {content.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editContent(content)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteContent(content.id)}
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
    </div>
  );
};
