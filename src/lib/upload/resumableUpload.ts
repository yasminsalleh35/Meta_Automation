import * as tus from 'tus-js-client';
import { supabase } from '@/integrations/supabase/client';

export interface UploadOptions {
  file: File;
  bucket: string;
  path: string;
  onProgress: (bytesUploaded: number, bytesTotal: number) => void;
  /** finalPath can differ from `path` when an interrupted upload of the same file is resumed. */
  onSuccess: (url: string, finalPath: string) => void;
  onError: (error: Error) => void;
}

export interface UploadControls {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

// Supabase Storage TUS exige chunks de exatamente 6MB.
const CHUNK_SIZE = 6 * 1024 * 1024;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const getAccessToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
};

export const resumableUpload = ({
  file,
  bucket,
  path,
  onProgress,
  onSuccess,
  onError
}: UploadOptions): UploadControls => {
  let upload: tus.Upload | null = null;
  let isPaused = false;
  let isCancelled = false;
  let objectName = path;
  const ownerFolder = `${path.split('/')[0]}/`;

  const startUpload = async () => {
    upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      // Retentativas longas para sobreviver a quedas de rede (o tus retoma do último chunk confirmado)
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000, 30000, 60000],
      chunkSize: CHUNK_SIZE,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName,
        contentType: file.type,
        cacheControl: '3600',
      },
      headers: {
        apikey: supabaseKey,
      },
      // Token renovado a cada requisição: uploads grandes passam de 1h e o JWT expiraria no meio
      onBeforeRequest: async (req) => {
        const token = await getAccessToken();
        req.setHeader('authorization', `Bearer ${token}`);
      },
      onError: (error) => {
        console.error('❌ Erro no upload:', {
          message: error.message,
          file: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        });
        onError(error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress(bytesUploaded, bytesTotal);
      },
      onSuccess: () => {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectName}`;
        onSuccess(publicUrl, objectName);
      },
    });

    // Retoma um upload interrompido do mesmo arquivo (mesmo bucket e pasta do usuário)
    try {
      const previousUploads = await upload.findPreviousUploads();
      const previous = previousUploads
        .filter((p) =>
          p.metadata?.bucketName === bucket &&
          typeof p.metadata?.objectName === 'string' &&
          p.metadata.objectName.startsWith(ownerFolder)
        )
        .sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime())[0];
      if (previous) {
        objectName = previous.metadata.objectName;
        upload.options.metadata = { ...upload.options.metadata, objectName };
        upload.resumeFromPreviousUpload(previous);
      }
    } catch (err) {
      console.warn('Não foi possível verificar uploads anteriores:', err);
    }

    if (isCancelled) return;
    upload.start();
  };

  startUpload().catch((err) => onError(err instanceof Error ? err : new Error(String(err))));

  return {
    pause: () => {
      if (upload && !isPaused) {
        upload.abort();
        isPaused = true;
      }
    },
    resume: () => {
      if (upload && isPaused) {
        // Mesmo objeto tus: continua do offset já enviado
        upload.start();
        isPaused = false;
      }
    },
    cancel: () => {
      isCancelled = true;
      if (upload) {
        upload.abort(true);
      }
    },
  };
};
