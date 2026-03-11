import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/hooks/useSupabase';
import { Loader2, Instagram, Image, Check } from 'lucide-react';

interface InstagramPost {
  id: string; // MEDIA_ID
  caption: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  instagram_user_id?: string; // ✅ FASE 2: capturar do prop
}

interface InstagramPostSelectorProps {
  instagramUserId: string;
  pageId?: string; // [CAMPly-FIX-Providers] Novo campo obrigatório
  selectedPost?: {
    id: string;
    caption: string;
    media_url: string;
    media_type?: string;
  } | null;
  onPostSelect: (post: { id: string; caption: string; media_url: string; instagram_user_id?: string; media_type?: string }) => void;
}

export const InstagramPostSelector: React.FC<InstagramPostSelectorProps> = ({
  instagramUserId,
  pageId, // [CAMPly-FIX-Providers] Novo parâmetro
  selectedPost,
  onPostSelect
}) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();
  
  console.log('🔍 [InstagramPostSelector] Props recebidos:', {
    instagramUserId,
    pageId,
    selectedPost,
    hasInstagramUserId: !!instagramUserId,
    hasPageId: !!pageId
  });

  const fetchInstagramPosts = async () => {
    if (!instagramUserId || !pageId) {
      console.warn('⚠️ [InstagramPostSelector] IDs faltando:', { instagramUserId, pageId });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // [CAMPly-FIX-Providers] Log seleção
      console.log('[InstagramPostSelector] Fetching posts', { instagramUserId, pageId });

      const payload = {
        action: 'get_instagram_posts',
        instagram_user_id: instagramUserId,
        page_id: pageId // [CAMPly-FIX-Providers] Agora obrigatório
      };

      console.log('[InstagramPostSelector] Fetch posts payload', payload);

      const response = await supabase.functions.invoke('simple-campaign-assets', {
        body: payload
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar posts do Instagram');
      }

      // Filtrar apenas posts de imagem e carrossel
      const filteredPosts = result.data.filter((post: InstagramPost) => 
        post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM'
      );

      setPosts(filteredPosts);
      console.log('Posts do Instagram carregados:', filteredPosts);
    } catch (err) {
      console.error('Erro ao buscar posts do Instagram:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstagramPosts();
  }, [instagramUserId, pageId]); // [CAMPly-FIX-Providers] Adicionar pageId como dependência

  const handlePostSelect = (post: InstagramPost) => {
    // ✅ FASE 2: Passar instagram_user_id + media_type junto com o post
    onPostSelect({
      id: post.id, // MEDIA_ID
      caption: post.caption || '',
      media_url: post.media_url,
      media_type: post.media_type, // ✅ Necessário para CTWA
      instagram_user_id: instagramUserId // ✅ Do prop recebido
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Posts do Instagram
          </CardTitle>
          <CardDescription>
            Carregando posts da sua conta...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Posts do Instagram
          </CardTitle>
          <CardDescription>
            Erro ao carregar posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={fetchInstagramPosts} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Posts do Instagram
          </CardTitle>
          <CardDescription>
            Nenhum post encontrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Nenhum post de imagem ou carrossel foi encontrado na sua conta do Instagram.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5 text-pink-600" />
          Posts do Instagram
        </CardTitle>
        <CardDescription>
          Selecione um post existente para promover (apenas imagens e carrosseis)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`relative rounded-lg border cursor-pointer transition-all hover:border-primary ${
                selectedPost?.id === post.id 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border'
              }`}
              onClick={() => handlePostSelect(post)}
            >
              {selectedPost?.id === post.id && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}
              
              <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={post.thumbnail_url || post.media_url}
                  alt="Post do Instagram"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = post.media_url;
                  }}
                />
              </div>
              
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    <Image className="h-3 w-3 mr-1" />
                    {post.media_type === 'CAROUSEL_ALBUM' ? 'Carrossel' : 'Imagem'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.caption || 'Post sem legenda'}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {selectedPost && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Post selecionado:</h4>
            <p className="text-sm text-muted-foreground">
              {selectedPost.caption || 'Post sem legenda'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};