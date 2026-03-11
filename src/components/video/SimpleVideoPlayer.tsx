import { useMemo } from "react";

type SimpleVideoPlayerProps = {
  content: {
    content_url: string;
    title?: string;
  };
  /** quando true usa youtube-nocookie (recomendado) */
  privacyMode?: boolean;
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // youtu.be/<id>
  let m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];

  // youtube.com/watch?v=<id> (inclui m.youtube.com)
  m = url.match(/(?:m\.)?youtube\.com\/watch\?[^#]*v=([^&?#]+)/i);
  if (m) return m[1];

  // youtube.com/embed/<id>
  m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];

  // fallback: tenta pegar ?v=<id> em qualquer URL
  m = url.match(/[?&]v=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];

  return null;
}

export default function SimpleVideoPlayer({
  content,
  privacyMode = true,
}: SimpleVideoPlayerProps) {
  const videoId = useMemo(() => extractYouTubeId(content?.content_url || ""), [content?.content_url]);

  if (!videoId) {
    return (
      <div className="w-full aspect-video grid place-items-center rounded-lg bg-neutral-900 text-red-300 text-sm p-4">
        URL inválida de YouTube.
      </div>
    );
  }

  const host = privacyMode
    ? "https://www.youtube-nocookie.com"
    : "https://www.youtube.com";

  const src = `${host}/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black relative">
      <iframe
        src={src}
        title={content?.title || "Vídeo do YouTube"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}
