import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { toMessage, toObject } from '../_shared/errors.ts';

// Config fixas
const META_API_VERSION = "v23.0";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

// util mínimo
function normAct(id: string) {
  if (!id) throw new Error("ad_account_id ausente");
  const clean = String(id).trim().replace(/"/g, "");
  return clean.startsWith("act_") ? clean : `act_${clean}`;
}
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ---------- INPUT ----------
    const payload = await req.json().catch(() => ({}));
    // flags de diagnóstico
    // stage: "campaign" | "adset" | "creative" | "ad" (default: "ad")
    // no_media: boolean (pula upload de mídia)
    const stage = (payload?.stage ?? "ad") as string;
    const noMedia = Boolean(payload?.no_media);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json(401, { success: false, error: "Authentication failed" });

    // integração
    const { data: integ, error: integErr } = await supabase
      .from("integrations")
      .select("provider, status, ad_account_id, page_id, access_token")
      .eq("user_id", user.id)
      .eq("provider", "meta_ads")
      .eq("status", "active")
      .maybeSingle();

    if (integErr || !integ) return json(400, { success: false, error: "No active Meta Ads integration found" });

    const actId = normAct(integ.ad_account_id);
    const accessToken = integ.access_token;

    // ---------- PRECHECK (leve, sem log/safeStringify) ----------
    const pre = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${actId}?fields=id,account_status&access_token=${accessToken}`);
    if (!pre.ok) {
      const body = await pre.text();
      return json(400, { success: false, error: "AdAccount precheck failed", status: pre.status, body: body.slice(0, 500) });
    }

    // ---------- (Opcional) Upload de mídia ----------
    // Somente se noMedia=false e selectedMediaMeta recebido
    let image_hash: string | undefined;
    let video_id: string | undefined;

    if (!noMedia && payload?.selectedMediaMeta?.public_url && payload?.selectedMediaMeta?.file_type) {
      const fileType = String(payload.selectedMediaMeta.file_type).toLowerCase();
      const isVideo = /^video\//.test(fileType);
      const endpoint = isVideo ? "advideos" : "adimages";

      if (isVideo) {
        const fd = new FormData();
        fd.append("file_url", payload.selectedMediaMeta.public_url);
        const up = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${actId}/${endpoint}?access_token=${accessToken}`, { method: "POST", body: fd });
        const jr = await up.json();
        if (!up.ok) return json(400, { success: false, error: "Video upload failed", detail: String(jr?.error?.message || jr).slice(0, 500) });
        video_id = jr?.id;
      } else {
        const img = await fetch(payload.selectedMediaMeta.public_url);
        const buff = await img.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buff)));
        const fd = new FormData();
        fd.append("filename", payload.selectedMediaMeta.filename || "image.png");
        fd.append("bytes", b64);
        const up = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${actId}/${endpoint}?access_token=${accessToken}`, { method: "POST", body: fd });
        const jr = await up.json();
        if (!up.ok) return json(400, { success: false, error: "Image upload failed", detail: String(jr?.error?.message || jr).slice(0, 500) });

        // tenta mapear hash
        image_hash = jr?.hash;
        if (!image_hash && jr?.images) {
          const keys = Object.keys(jr.images);
          for (const k of keys) {
            const h = jr.images[k]?.hash;
            if (h) { image_hash = h; break; }
          }
        }
        if (!image_hash) return json(400, { success: false, error: "Upload ok but image hash not found" });
      }
    }

    // ---------- Campaign ----------
    const campaignCfg = {
      name: payload?.campaignName || "Camply Campaign",
      objective: "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: [],
    };
    const cRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${actId}/campaigns?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignCfg),
    });
    const cJson = await cRes.json();
    if (!cRes.ok) return json(400, { success: false, stage: "campaign", error: String(cJson?.error?.message || cJson).slice(0, 500) });
    const campaign_id = cJson.id;

    if (stage === "campaign") {
      return json(200, { success: true, stage, campaign_id });
    }

    // ---------- AdSet ----------
    const adsetCfg = {
      name: `${campaignCfg.name} - AdSet`,
      campaign_id,
      daily_budget: Math.round(Number(payload?.dailyBudget || 30) * 100),
      billing_event: payload?.billing_event || "LINK_CLICKS",
      optimization_goal: payload?.optimization_goal || "LINK_CLICKS",
      targeting: {
        age_min: 18,
        age_max: 65,
        genders: [0],
        geo_locations: payload?.coordinates
          ? { custom_locations: [{ latitude: payload.coordinates.lat, longitude: payload.coordinates.lng, radius: payload.radius || 25, distance_unit: "kilometer" }] }
          : { countries: ["BR"] },
        publisher_platforms: payload?.instagram ? ["facebook", "instagram"] : ["facebook"],
        device_platforms: ["mobile"],
      },
      status: "PAUSED",
    };
    const asRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${actId}/adsets?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adsetCfg),
    });
    const asJson = await asRes.json();
    if (!asRes.ok) return json(400, { success: false, stage: "adset", error: String(asJson?.error?.message || asJson).slice(0, 500) });
    const adset_id = asJson.id;

    if (stage === "adset") {
      return json(200, { success: true, stage, campaign_id, adset_id });
    }

    // ---------- Creative ----------
    const link_data: Record<string, unknown> = {
      message: payload?.adText || "",
      link: payload?.whatsappLink || "https://wa.me/",
      name: payload?.adTitle || "Camply Ad",
      description: payload?.adText || "",
      call_to_action: { type: "LEARN_MORE", value: { link: payload?.whatsappLink || "https://wa.me/" } },
    };
    if (image_hash) link_data.image_hash = image_hash;
    if (video_id) link_data.video_id = video_id;

    const oss: Record<string, unknown> = {
      page_id: integ.page_id,
      link_data,
    };
    if (payload?.instagram) oss["instagram_actor_id"] = payload.instagram; // sem retry aqui (mínimo)

    const creativeCfg = {
      name: `${campaignCfg.name} - Creative`,
      object_story_spec: oss,
    };

    const crRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${actId}/adcreatives?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creativeCfg),
    });
    const crJson = await crRes.json();
    if (!crRes.ok) return json(400, { success: false, stage: "creative", error: String(crJson?.error?.message || crJson).slice(0, 500) });
    const creative_id = crJson.id;

    if (stage === "creative") {
      return json(200, { success: true, stage, campaign_id, adset_id, creative_id });
    }

    // ---------- Ad ----------
    const adCfg = {
      name: `${campaignCfg.name} - Ad`,
      adset_id,
      creative: { creative_id },
      status: "PAUSED",
    };
    const adRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${actId}/ads?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adCfg),
    });
    const adJson = await adRes.json();
    if (!adRes.ok) return json(400, { success: false, stage: "ad", error: String(adJson?.error?.message || adJson).slice(0, 500) });
    const ad_id = adJson.id;

    return json(200, { success: true, stage: "ad", campaign_id, adset_id, creative_id, ad_id });

  } catch (e) {
    const msg = e && typeof e === "object" && "message" in (e as any) ? (e as any).message : String(e);
    return json(500, { success: false, error: String(msg).slice(0, 500) });
  }
});