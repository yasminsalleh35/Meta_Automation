import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSupabase } from '@/hooks/useSupabase';
import { Loader2, Instagram, Image, Film, LayoutGrid, Check, Info, ChevronDown } from 'lucide-react';

interface InstagramPost {
  id: string;
  caption: string;
  media_type: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_url: string;
  thumbnail_url?: string;
  instagram_user_id?: string;
}

interface InstagramPostSelectorProps {
  instagramUserId: string;
  pageId?: string;
  selectedPost?: {
    id: string;
    caption: string;
    media_url: string;
    media_type?: string;
  } | null;
  onPostSelect: (post: {
    id: string;
    caption: string;
    media_url: string;
    instagram_user_id?: string;
    media_type?: string;
  }) => void;
}

const mediaTypeConfig: Record<string, { label: string; icon: typeof Image; color: string; tooltip?: string }> = {
  IMAGE: {
    label: 'Imagem',
    icon: Image,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  CAROUSEL_ALBUM: {
    label: 'Carrossel',
    icon: LayoutGrid,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  VIDEO: {
    label: 'Reels / Video',
    icon: Film,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    tooltip: 'Videos e Reels sao automaticamente convertidos em dark posts para uso como anuncio.',
  },
};

export const InstagramPostSelector: React.FC<InstagramPostSelectorProps> = ({
  instagramUserId,
  pageId,
  selectedPost,
  onPostSelect,
}) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const supabase = useSupabase();

  const fetchInstagramPosts = useCallback(async (cursor?: string) => {
    if (!instagramUserId || !pageId) return;

    if (cursor) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const payload: Record<string, any> = {
        action: 'get_instagram_posts',
        instagram_user_id: instagramUserId,
        page_id: pageId,
        limit: 30,
      };
      if (cursor) payload.after = cursor;

      const response = await supabase.functions.invoke('simple-campaign-assets', {
        body: payload,
      });

      if (response.error) throw new Error(response.error.message);

      const result = response.data;
      if (!result.success) throw new Error(result.error || 'Erro ao buscar posts do Instagram');

      const newPosts: InstagramPost[] = result.data || [];

      if (cursor) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setNextCursor(result.pagination?.after || null);
      setHasNextPage(result.pagination?.has_next_page || false);
    } catch (err) {
      console.error('Erro ao buscar posts do Instagram:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [instagramUserId, pageId, supabase]);

  useEffect(() => {
    fetchInstagramPosts();
  }, [fetchInstagramPosts]);

  const handlePostSelect = (post: InstagramPost) => {
    onPostSelect({
      id: post.id,
      caption: post.caption || '',
      media_url: post.media_url,
      media_type: post.media_type,
      instagram_user_id: instagramUserId,
    });
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchInstagramPosts(nextCursor);
    }
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Posts do Instagram
          </CardTitle>
          <CardDescription>Carregando posts da sua conta...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Posts do Instagram
          </CardTitle>
          <CardDescription>Erro ao carregar posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchInstagramPosts()} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ──
  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Posts do Instagram
          </CardTitle>
          <CardDescription>Nenhum post encontrado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Nenhum post foi encontrado na sua conta do Instagram.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Posts grid ──
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5 text-pink-600" />
          Posts do Instagram
        </CardTitle>
        <CardDescription>
          Selecione um post para promover (imagens, carrosseis e Reels)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => {
            const config = mediaTypeConfig[post.media_type] || mediaTypeConfig.IMAGE;
            const IconComponent = config.icon;
            const isSelected = selectedPost?.id === post.id;
            const isVideo = post.media_type === 'VIDEO';

            return (
              <div
                key={post.id}
                className={`relative rounded-lg border cursor-pointer transition-all hover:border-primary ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
                onClick={() => handlePostSelect(post)}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
                  <img
                    src={post.thumbnail_url || post.media_url}
                    alt="Post do Instagram"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = post.media_url;
                    }}
                  />
                  {/* Play indicator for videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-black/60 rounded-full p-2">
                        <Film className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                      <IconComponent className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    {config.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          {config.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.caption || 'Post sem legenda'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load more button */}
        {hasNextPage && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              {isLoadingMore ? 'Carregando...' : 'Carregar mais posts'}
            </Button>
          </div>
        )}

        {/* Selected post summary */}
        {selectedPost && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">Post selecionado</h4>
              {selectedPost.media_type && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {mediaTypeConfig[selectedPost.media_type]?.label || selectedPost.media_type}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {selectedPost.caption || 'Post sem legenda'}
            </p>
            {(selectedPost.media_type === 'VIDEO') && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Este Reel sera convertido automaticamente em dark post.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
