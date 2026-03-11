
import { META_API_VERSION, normalizeAdAccountId, resolveMediaType, buildMetaApiUrl, logMetaApiRequest } from './utils/metaApiConstants';

export class MetaAdsCreativeService {
  private baseUrl = buildMetaApiUrl('');

  // Upload creative (image or video) with enhanced validation and logging
  async uploadCreative(adAccountId: string, file: File, accessToken: string): Promise<{ hash?: string; video_id?: string; url?: string }> {
    const actId = normalizeAdAccountId(adAccountId);
    const mediaKind = resolveMediaType(file.type);
    const endpoint = mediaKind === 'video' ? 'advideos' : 'adimages';
    
    logMetaApiRequest('MEDIA-UPLOAD', {
      ad_account_normalized: actId,
      media_kind: mediaKind,
      endpoint,
      content_length: file.size,
      mime: file.type,
      api_version: META_API_VERSION
    });

    // Precheck da Ad Account (com id normalizado e versão única)
    const precheckUrl = buildMetaApiUrl(`/${actId}?fields=id,account_status&access_token=${accessToken}`);
    const precheckResponse = await fetch(precheckUrl);
    const precheckData = await precheckResponse.json();
    
    logMetaApiRequest('PRECHECK', {
      ad_account_normalized: actId,
      status: precheckResponse.status,
      body_preview: JSON.stringify(precheckData).substring(0, 300)
    });

    if (!precheckResponse.ok) {
      logMetaApiRequest('PRECHECK-FAIL', {
        ad_account_normalized: actId,
        error_code: precheckData.error?.code,
        error_message: precheckData.error?.message,
        fbtrace_id: precheckResponse.headers.get('x-fb-trace-id')
      });
      throw new Error(`AdAccount validation failed: ${precheckData.error?.message}`);
    }

    const formData = new FormData();
    formData.append('filename', file.name);
    
    if (mediaKind === 'video') {
      // Vídeo: usar file_url (URL pública do Supabase Storage)
      // Assumindo que temos acesso à URL pública através de algum metadata
      // Para vídeos, precisamos da URL pública, não do File object
      throw new Error('Para upload de vídeo, use uploadVideoFromUrl com a URL pública do arquivo');
    } else {
      // Imagem: converter para base64 em chunks
      const base64 = await this.fileToBase64(file);
      formData.append('bytes', base64);
    }

    const uploadUrl = buildMetaApiUrl(`/${actId}/${endpoint}?access_token=${accessToken}`);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    logMetaApiRequest('UPLOAD-RESPONSE', {
      ad_account_normalized: actId,
      media_kind: mediaKind,
      status: response.status,
      fbtrace_id: response.headers.get('x-fb-trace-id'),
      body_preview: JSON.stringify(result).substring(0, 300)
    });

    if (!response.ok) {
      logMetaApiRequest('UPLOAD-FAIL', {
        ad_account_normalized: actId,
        media_kind: mediaKind,
        error_code: result.error?.code,
        error_message: result.error?.message,
        fbtrace_id: response.headers.get('x-fb-trace-id')
      });
      throw new Error(`Failed to upload ${mediaKind}: ${result.error?.message}`);
    }

    // This code won't be reached for videos since we throw above
    // For images, try multiple paths to find the hash
    let imageHash = null;
    let imageUrl = null;
    
    // Method 1: Check if hash is directly in result
    if (result.hash) {
      imageHash = result.hash;
      console.log('📸 Found hash directly in result:', imageHash);
    }
    
    // Method 2: Check result.images[filename].hash
    else if (result.images && result.images[file.name] && result.images[file.name].hash) {
      imageHash = result.images[file.name].hash;
      imageUrl = result.images[file.name].url;
      console.log('📸 Found hash in images[filename]:', imageHash);
    }
    
    // Method 3: Try to find any hash in the images object
    else if (result.images) {
      const imageKeys = Object.keys(result.images);
      console.log('🔍 Available image keys:', imageKeys);
      
      for (const key of imageKeys) {
        if (result.images[key] && result.images[key].hash) {
          imageHash = result.images[key].hash;
          imageUrl = result.images[key].url;
          console.log(`📸 Found hash in images[${key}]:`, imageHash);
          break;
        }
      }
    }
    
    // Method 4: Check if the entire result is the hash (some API versions)
    else if (typeof result === 'string' && result.length > 10) {
      imageHash = result;
      console.log('📸 Result appears to be hash directly:', imageHash);
    }

    if (imageHash) {
      console.log('✅ Final image hash extracted:', imageHash);
      console.log('🔗 Image URL:', imageUrl);
      return { 
        hash: imageHash,
        url: imageUrl
      };
    } else {
      console.error('❌ No hash found in upload result. Full result structure:', result);
      console.error('Result keys:', Object.keys(result));
      if (result.images) {
        console.error('Images object keys:', Object.keys(result.images));
        Object.keys(result.images).forEach(key => {
          console.error(`Images[${key}]:`, result.images[key]);
        });
      }
      throw new Error('Upload bem-sucedido mas hash da imagem não encontrado. Estrutura de resposta inesperada.');
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

export const metaAdsCreativeService = new MetaAdsCreativeService();
