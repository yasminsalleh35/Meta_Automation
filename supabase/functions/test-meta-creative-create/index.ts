// Supabase Edge Function: test-meta-creative-create
// Last updated: 2025-10-09 - ✅ CORREÇÃO v23: IMAGE usa image_url (dark post), VIDEO usa source_instagram_media_id
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { 
      creativeType, 
      adAccountId, 
      pageId, 
      imageUrl, 
      instagramUserId,
      instagramMediaId,
      adTitle, 
      adText, 
      callToAction, 
      accessToken 
    } = payload;

    console.log('[TEST-META-CREATIVE-CREATE] Request received:', {
      creativeType: creativeType || 'upload',
      adAccountId,
      pageId,
      hasImageUrl: !!imageUrl,
      hasInstagramData: !!instagramUserId && !!instagramMediaId,
      hasAccessToken: !!accessToken,
    });

    // Normalizar ad account ID
    const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    let imageHash: string | null = null;
    let objectStoryId: string | null = null;
    
    // Fase 5: Fluxo diferente para upload vs post
    if (creativeType === 'post') {
      // Usar post existente do Instagram
      console.log('[TEST-META-CREATIVE-CREATE] Using existing Instagram post');
      
      if (!instagramUserId || !instagramMediaId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Instagram User ID e Media ID são obrigatórios para creative tipo "post"',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Construir object_story_id: {IG_USER_ID}_{MEDIA_ID}
      objectStoryId = `${instagramUserId}_${instagramMediaId}`;
      console.log('[TEST-META-CREATIVE-CREATE] Object Story ID:', objectStoryId);
      
      // FASE 1: Validar se o post existe e é acessível
      console.log('[TEST-META-CREATIVE-CREATE] Validating Instagram media...');
      const mediaCheckUrl = `https://graph.facebook.com/v23.0/${instagramMediaId}?fields=id,caption,media_type,permalink,owner&access_token=${accessToken}`;
      const mediaCheckResponse = await fetch(mediaCheckUrl);
      const mediaCheckResult = await mediaCheckResponse.json();

      if (!mediaCheckResponse.ok) {
        console.error('[TEST-META-CREATIVE-CREATE] Instagram media validation failed:', {
          status: mediaCheckResponse.status,
          error: mediaCheckResult,
          fbTraceId: mediaCheckResponse.headers.get('x-fb-trace-id')
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: `Post do Instagram inválido ou inacessível: ${mediaCheckResult.error?.message}`,
            details: mediaCheckResult,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const mediaType = mediaCheckResult.media_type; // IMAGE | VIDEO | CAROUSEL_ALBUM
      
      console.log('[TEST-META-CREATIVE-CREATE] Instagram media validated:', {
        id: mediaCheckResult.id,
        type: mediaType,
        permalink: mediaCheckResult.permalink,
        ownerId: mediaCheckResult.owner?.id
      });
      
      // Validar que o post pertence à conta Instagram selecionada
      if (mediaCheckResult.owner?.id && mediaCheckResult.owner.id !== instagramUserId) {
        console.error('[TEST-META-CREATIVE-CREATE] Media owner mismatch:', {
          expected: instagramUserId,
          actual: mediaCheckResult.owner?.id
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: 'O post não pertence à conta Instagram selecionada',
            details: { expected: instagramUserId, actual: mediaCheckResult.owner?.id }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Rejeitar carrossel (não suporta source_instagram_media_id para CTWA)
      if (mediaType === 'CAROUSEL_ALBUM') {
        console.error('[TEST-META-CREATIVE-CREATE] CAROUSEL_ALBUM não suportado para CTWA');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Posts tipo CAROUSEL_ALBUM não são suportados para campanhas WhatsApp. Escolha uma imagem ou vídeo único.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[TEST-META-CREATIVE-CREATE] ✅ Instagram post validation passed');
      
    } else {
      // Fluxo original: Upload de imagem
      console.log('[TEST-META-CREATIVE-CREATE] Step 1: Uploading image to Meta...');
      
      // Baixar a imagem da URL com timeout de 20s
      const downloadController = new AbortController();
      const downloadTimeout = setTimeout(() => downloadController.abort(), 20000);
      
      const imageResponse = await fetch(imageUrl, { signal: downloadController.signal });
      clearTimeout(downloadTimeout);
      
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      
      // Converter para Base64 em chunks para evitar stack overflow
      const uint8Array = new Uint8Array(imageBuffer);
      let base64Image = '';
      const chunkSize = 8192; // 8KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64Image += String.fromCharCode(...chunk);
      }
      base64Image = btoa(base64Image);

      // Upload da imagem
      const uploadFormData = new FormData();
      uploadFormData.append('bytes', base64Image);
      
      const uploadUrl = `https://graph.facebook.com/v23.0/${actId}/adimages?access_token=${accessToken}`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();
      
      console.log('[TEST-META-CREATIVE-CREATE] Image upload response:', {
        status: uploadResponse.status,
        ok: uploadResponse.ok,
        response: uploadResult,
        fbTraceId: uploadResponse.headers.get('x-fb-trace-id'),
      });

      if (!uploadResponse.ok) {
        console.error('[TEST-META-CREATIVE-CREATE] Image upload failed:', {
          errorCode: uploadResult.error?.code,
          errorMessage: uploadResult.error?.message,
          fbTraceId: uploadResponse.headers.get('x-fb-trace-id'),
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: uploadResult.error?.message || 'Erro ao fazer upload da imagem',
            rawResponse: uploadResult,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Extrair image hash
      if (uploadResult.images) {
        const imageKeys = Object.keys(uploadResult.images);
        if (imageKeys.length > 0) {
          imageHash = uploadResult.images[imageKeys[0]].hash;
        }
      }

      if (!imageHash) {
        console.error('[TEST-META-CREATIVE-CREATE] No image hash found in upload response');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Hash da imagem não encontrado na resposta do upload',
            rawResponse: uploadResult,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('[TEST-META-CREATIVE-CREATE] Image uploaded successfully, hash:', imageHash);
    }

    // Passo 2: Criar Ad Creative
    console.log('[TEST-META-CREATIVE-CREATE] Step 2: Creating ad creative...');
    
    // ✅ CORREÇÃO CTWA: Usar object_story_spec + source_instagram_media_id para posts
    let creativeConfig: any;
    
    if (creativeType === 'post') {
      // ✅ CORREÇÃO v23: IMAGE usa image_url (dark post), VIDEO usa source_instagram_media_id
      const mediaInfo = await (async () => {
        const mediaCheckUrl = `https://graph.facebook.com/v23.0/${instagramMediaId}?fields=media_type,media_url,thumbnail_url&access_token=${accessToken}`;
        const response = await fetch(mediaCheckUrl);
        const result = await response.json();
        return {
          mediaType: result.media_type,
          mediaUrl: result.media_url,
          thumbnailUrl: result.thumbnail_url
        };
      })();
      
      const objectStorySpec: any = {
        page_id: pageId,
        instagram_user_id: instagramUserId, // v23 usa instagram_user_id
      };
      
      if (mediaInfo.mediaType === 'IMAGE') {
        // ✅ Para IMAGE: usar image_url (cria "dark post" novo)
        // NÃO usar source_instagram_media_id em photo_data (erro 1443050)
        if (!mediaInfo.mediaUrl) {
          throw new Error('media_url não disponível para post tipo IMAGE');
        }
        objectStorySpec.photo_data = {
          image_url: mediaInfo.mediaUrl, // URL da imagem do post
          message: adText || 'Fale conosco!',
          call_to_action: {
            type: 'WHATSAPP_MESSAGE'
          }
        };
      } else if (mediaInfo.mediaType === 'VIDEO') {
        // ✅ Para VIDEO: usar source_instagram_media_id (permitido em video_data)
        objectStorySpec.video_data = {
          source_instagram_media_id: instagramMediaId,
          message: adText || 'Fale conosco!',
          call_to_action: {
            type: 'WHATSAPP_MESSAGE'
          }
        };
        // Thumbnail opcional
        if (mediaInfo.thumbnailUrl) {
          objectStorySpec.video_data.image_url = mediaInfo.thumbnailUrl;
        }
      }
      
      creativeConfig = {
        name: `${adTitle} - Creative (Instagram Post CTWA)`,
        object_story_spec: objectStorySpec
      };
      
      console.log('[TEST-META-CREATIVE-CREATE] Creative config for CTWA:', {
        mediaType: mediaInfo.mediaType,
        creativeMethod: mediaInfo.mediaType === 'IMAGE' ? 'photo_data.image_url (dark post)' : 'video_data.source_instagram_media_id',
        hasPhotoData: !!objectStorySpec.photo_data,
        hasVideoData: !!objectStorySpec.video_data,
        hasCTA: !!(objectStorySpec.photo_data?.call_to_action || objectStorySpec.video_data?.call_to_action),
        imageUrl: mediaInfo.mediaType === 'IMAGE' ? mediaInfo.mediaUrl : undefined
      });
      
    } else {
      // Upload direto de imagem
      creativeConfig = {
        name: `${adTitle} - Creative`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            image_hash: imageHash,
            link: `https://wa.me/${pageId}`, // Placeholder - será substituído pela Meta
            message: adText,
            name: adTitle,
            call_to_action: callToAction || {
              type: 'WHATSAPP_MESSAGE'
            }
          }
        }
      };
    }

    const creativeUrl = `https://graph.facebook.com/v23.0/${actId}/adcreatives?access_token=${accessToken}`;
    
    console.log('[TEST-META-CREATIVE-CREATE] Creating creative with config:', {
      url: creativeUrl.replace(accessToken, 'TOKEN_MASKED'),
      body: creativeConfig,
    });

    // Criar creative com timeout de 25s
    const creativeController = new AbortController();
    const creativeTimeout = setTimeout(() => creativeController.abort(), 25000);
    
    const creativeResponse = await fetch(creativeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creativeConfig),
      signal: creativeController.signal,
    });
    
    clearTimeout(creativeTimeout);

    const creativeResult = await creativeResponse.json();
    
    console.log('[TEST-META-CREATIVE-CREATE] Creative creation response:', {
      status: creativeResponse.status,
      ok: creativeResponse.ok,
      response: creativeResult,
      fbTraceId: creativeResponse.headers.get('x-fb-trace-id'),
    });

    if (!creativeResponse.ok) {
      console.error('[TEST-META-CREATIVE-CREATE] Creative creation failed:', {
        errorCode: creativeResult.error?.code,
        errorMessage: creativeResult.error?.message,
        fbTraceId: creativeResponse.headers.get('x-fb-trace-id'),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: creativeResult.error?.message || 'Erro ao criar creative',
          rawResponse: creativeResult,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[TEST-META-CREATIVE-CREATE] Creative created successfully:', creativeResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        creativeId: creativeResult.id,
        imageHash: imageHash,
        objectStoryId: objectStoryId,
        rawResponse: creativeResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[TEST-META-CREATIVE-CREATE] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
