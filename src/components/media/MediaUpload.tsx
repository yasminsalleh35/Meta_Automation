import React, { useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onUpload: (file: File, tags?: string[]) => Promise<any>;
  isUploading: boolean;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUpload,
  isUploading,
  accept = "image/*,video/*",
  maxSize = 100,
  multiple = false
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/mov', 'video/avi'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato não suportado', description: `${file.name}: Use JPG, PNG, WebP, GIF, MP4, MOV ou AVI.`, variant: 'destructive' });
      return false;
    }
    const isImage = file.type.startsWith('image/');
    const maxFileSize = isImage ? 50 * 1024 * 1024 : 1024 * 1024 * 1024;
    if (file.size > maxFileSize) {
      toast({ title: 'Arquivo muito grande', description: `${isImage ? 'Imagens' : 'Vídeos'} devem ter no máximo ${isImage ? '50MB' : '1GB'}`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(validateFile);
    setSelectedFiles(prev => multiple ? [...prev, ...validFiles] : validFiles.slice(0, 1));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  // Listener para progresso de upload
  React.useEffect(() => {
    const handleProgress = (event: Event) => {
      const { filename, percentage } = (event as CustomEvent).detail;
      setUploadProgress(prev => ({ ...prev, [filename]: percentage }));
    };
    window.addEventListener('upload-progress', handleProgress);
    return () => window.removeEventListener('upload-progress', handleProgress);
  }, []);

  // Listener para conclusão de upload (sucesso ou falha)
  React.useEffect(() => {
    const handleComplete = (event: Event) => {
      const { filename, success } = (event as CustomEvent).detail;
      console.log(`📦 Upload complete event: ${filename}, success: ${success}`);
      
      // Limpar arquivo da lista e progress após um pequeno delay
      setTimeout(() => {
        setSelectedFiles(prev => prev.filter(f => f.name !== filename));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[filename];
          return newProgress;
        });
      }, success ? 1000 : 2000);
    };
    
    window.addEventListener('upload-complete', handleComplete);
    return () => window.removeEventListener('upload-complete', handleComplete);
  }, []);

  const uploadFiles = async () => {
    for (const file of selectedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        await onUpload(file);
        // Remoção agora é tratada pelo evento upload-complete
      } catch (error) {
        console.error('Erro no upload:', error);
        // Remoção em caso de erro também é tratada pelo evento upload-complete
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => type.startsWith('image/') ? <Image className="w-8 h-8 text-blue-500" /> : <Video className="w-8 h-8 text-purple-500" />;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Upload de Mídias</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
          <input ref={fileInputRef} type="file" accept={accept} multiple={multiple} onChange={(e) => handleFiles(e.target.files)} className="hidden" disabled={isUploading} />
          <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Arraste arquivos aqui ou clique para selecionar</h3>
            <p className="text-gray-600 mb-4">Imagens: JPG, PNG, WebP, GIF | Vídeos: MP4, MOV, AVI<br /><span className="text-xs">Imagens até 50MB • Vídeos até 1GB</span></p>
          </div>
          <Button variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="mt-2">Selecionar Arquivos</Button>
        </div>
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Arquivos selecionados:</h4>
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadProgress[file.name] !== undefined && (
                    <div className="flex items-center space-x-2">
                      <Progress value={uploadProgress[file.name]} className="w-32 h-2" />
                      <span className="text-xs text-gray-600">{uploadProgress[file.name]}%</span>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))} disabled={isUploading}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedFiles.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={uploadFiles} disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? 'Enviando...' : `Enviar ${selectedFiles.length} arquivo(s)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
