import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface VideoPlayerProps {
  content: any;
  progress?: any;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  content, 
  progress, 
  onProgressUpdate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerSize, setPlayerSize] = useState({ width: 640, height: 360 });
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const progressInterval = useRef<NodeJS.Timeout>();

  // Calculate responsive player size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.floor(width * 9 / 16); // Aspect ratio 16:9
        setPlayerSize({ width, height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(content.content_url || '');

  const onReady: YouTubeProps['onReady'] = (event) => {
    console.log('🎬 YouTube Player Ready:', event.target);
    console.log('📹 Video ID:', videoId);
    console.log('⚙️ Player Size:', playerSize);
    
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    setIsPlayerReady(true);
    setPlayerError(null);
    
    // Seek to saved progress if available
    if (progress?.progress_percentage && progress.progress_percentage > 0) {
      const startTime = (progress.progress_percentage / 100) * event.target.getDuration();
      event.target.seekTo(startTime, true);
    }
  };

  const onError = (error: any) => {
    const errorCodes: Record<number, string> = {
      2: 'Parâmetro de requisição inválido',
      5: 'Erro no player HTML5',
      100: 'Vídeo não encontrado ou privado',
      101: 'Incorporação não permitida pelo proprietário',
      150: 'Incorporação não permitida pelo proprietário',
    };
    
    const code = error?.data;
    const message = errorCodes[code] || 'Erro desconhecido ao carregar vídeo';
    
    console.error('❌ YouTube Error Code:', code, '-', message);
    console.error('❌ Full Error:', error);
    console.error('❌ Video URL:', content.content_url);
    console.error('❌ Video ID:', videoId);
    
    setPlayerError(message);
    setIsPlayerReady(false);
  };

  const onPlay = () => {
    console.log('▶️ Video playing');
    setIsPlaying(true);
    // Start tracking progress
    progressInterval.current = setInterval(() => {
      if (player) {
        const current = player.getCurrentTime();
        const total = player.getDuration();
        setCurrentTime(current);
        if (onProgressUpdate) {
          onProgressUpdate(current, total);
        }
      }
    }, 1000);
  };

  const onPause = () => {
    console.log('⏸️ Video paused');
    setIsPlaying(false);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const onEnd = () => {
    console.log('⏹️ Video ended');
    setIsPlaying(false);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    // Mark as complete when video ends
    if (onProgressUpdate) {
      onProgressUpdate(duration, duration);
    }
  };

  const togglePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const toggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
      } else {
        player.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const goFullscreen = () => {
    if (player && player.getIframe()) {
      const iframe = player.getIframe();
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

  const restart = () => {
    if (player) {
      player.seekTo(0);
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  if (!videoId) {
    return (
      <Card className="aspect-video flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground">URL de vídeo inválida</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique se o link do YouTube está correto
          </p>
        </div>
      </Card>
    );
  }

  const opts: YouTubeProps['opts'] = {
    height: playerSize.height.toString(),
    width: playerSize.width.toString(),
    playerVars: {
      autoplay: 0,
      controls: 1, // Enable native YouTube controls
      disablekb: 0,
      fs: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onPlay={onPlay}
          onPause={onPause}
          onEnd={onEnd}
          onError={onError}
          className="w-full h-full"
        />

        {/* Loading State */}
        {!isPlayerReady && !playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-white text-center">
              <div className="animate-pulse">Carregando vídeo...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-white text-center p-6 max-w-md">
              <p className="font-semibold mb-2 text-lg">❌ Erro ao carregar vídeo</p>
              <p className="text-sm text-red-300">{playerError}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Verifique se o link do YouTube está correto e se o vídeo permite incorporação
              </p>
            </div>
          </div>
        )}
        
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={restart}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="w-full h-1 bg-white/30 rounded-full">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ 
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};