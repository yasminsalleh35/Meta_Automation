import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface CampaignPreviewImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

/**
 * Componente resiliente para preview de imagens de campanhas
 * Exibe placeholder em caso de erro ou URL ausente
 */
export const CampaignPreviewImage: React.FC<CampaignPreviewImageProps> = ({
  src,
  alt = 'Preview da campanha',
  className = 'w-full h-full object-cover'
}) => {
  const [hasError, setHasError] = useState(false);

  // Se não há src ou houve erro, exibe placeholder
  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
        <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};
