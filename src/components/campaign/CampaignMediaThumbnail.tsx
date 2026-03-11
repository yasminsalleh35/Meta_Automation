
import React, { useState, useEffect } from 'react';
import { Image, Video, FileText, Loader2, Play, ImageIcon } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';

interface CampaignMediaThumbnailProps {
  mediaFileId?: string;
  className?: string;
  showLabel?: boolean;
}

export const CampaignMediaThumbnail: React.FC<CampaignMediaThumbnailProps> = ({
  mediaFileId,
  className = "w-16 h-16",
  showLabel = false
}) => {
  const supabase = useSupabase();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (mediaFileId) {
      fetchMediaInfo();
    }
  }, [mediaFileId]);

  const fetchMediaInfo = async () => {
    if (!mediaFileId) return;

    setIsLoading(true);
    setHasError(false);
    
    try {
      // Get media file info from database
      const { data: mediaFile, error } = await supabase
        .from('media_files')
        .select('file_path, file_type')
        .eq('id', mediaFileId)
        .single();

      if (error || !mediaFile) {
        console.warn('Media file not found:', mediaFileId);
        setHasError(true);
        return;
      }

      // Get public URL from Supabase Storage
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(mediaFile.file_path);

      if (urlData?.publicUrl) {
        setMediaUrl(urlData.publicUrl);
        
        // Determine media type
        if (mediaFile.file_type?.startsWith('image/')) {
          setMediaType('image');
        } else if (mediaFile.file_type?.startsWith('video/')) {
          setMediaType('video');
        } else {
          setMediaType('unknown');
        }
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Error fetching media info:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlaceholder = (icon: React.ElementType, bgColor: string, iconColor: string) => {
    const IconComponent = icon;
    return (
      <div className={`${className} ${bgColor} rounded-xl flex items-center justify-center border-2 border-white shadow-sm`}>
        <IconComponent className={`w-6 h-6 ${iconColor}`} />
      </div>
    );
  };

  if (!mediaFileId) {
    return renderPlaceholder(FileText, 'bg-gray-100', 'text-gray-400');
  }

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm`}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (hasError || !mediaUrl) {
    return renderPlaceholder(ImageIcon, 'bg-red-50', 'text-red-400');
  }

  if (mediaType === 'image') {
    return (
      <div className={`${className} relative rounded-xl overflow-hidden bg-gray-100 border-2 border-white shadow-lg group`}>
        <img
          src={mediaUrl}
          alt="Campaign media"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => {
            setMediaType('unknown');
            setHasError(true);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {showLabel && (
          <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Image className="w-3 h-3" />
              Imagem
            </span>
          </div>
        )}
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className={`${className} relative rounded-xl overflow-hidden bg-gray-100 border-2 border-white shadow-lg group`}>
        <video
          src={mediaUrl}
          className="w-full h-full object-cover"
          muted
          onError={() => {
            setMediaType('unknown');
            setHasError(true);
          }}
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 group-hover:scale-110 transition-transform duration-300">
            <Play className="w-4 h-4 text-gray-700" />
          </div>
        </div>
        {showLabel && (
          <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Video className="w-3 h-3" />
              Vídeo
            </span>
          </div>
        )}
      </div>
    );
  }

  return renderPlaceholder(FileText, 'bg-blue-50', 'text-blue-400');
};
