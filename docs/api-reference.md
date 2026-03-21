# Camply API Reference

> Edge Functions hosted on Supabase. Base URL: `https://<PROJECT_ID>.supabase.co/functions/v1/`

## Authentication

All endpoints require a Bearer token (Supabase JWT) in the `Authorization` header unless marked as public.

```
Authorization: Bearer <supabase_jwt_token>
```

---

## Campaign Management

### `POST /simple-campaign-create`

Creates a full Meta Ads campaign (campaign + ad set + creative + ad) in a single call.

**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `campaignName` | string | Yes | Campaign display name |
| `adTitle` | string | Yes | Ad headline |
| `adText` | string | Yes | Ad body text |
| `fanpage` | string | Yes | Facebook Page ID |
| `instagram` | string | Yes | Instagram Actor ID |
| `whatsappLink` | string | Yes | wa.me link for CTWA |
| `dailyBudget` | number | Yes | Daily budget in BRL (min 5) |
| `startDate` | string | Yes | ISO date (YYYY-MM-DD) |
| `endDate` | string | No | ISO date, null = open-ended |
| `city` | string | Yes | Target city name |
| `radius` | number | Yes | Radius in km (1-80) |
| `ageMin` | number | Yes | Min age (18-65) |
| `ageMax` | number | Yes | Max age (18-65) |
| `gender` | string | Yes | `all`, `male`, or `female` |
| `creativeType` | string | Yes | `upload` or `post` |
| `selectedMediaMeta` | object | If upload | `{ file_type, public_url, filename }` |
| `selectedInstagramPostId` | string | If post | Instagram media ID |
| `instagramUserId` | string | If post | Instagram user ID |
| `useAISuggestions` | boolean | No | Use AI-generated targeting |

**Response:**
```json
{
  "success": true,
  "campaign_id": "120210...",
  "adset_id": "120210...",
  "creative_id": "120210...",
  "ad_id": "120210..."
}
```

### `POST /simple-campaign-list`

Lists campaigns for the authenticated user.

**Body:**
```json
{ "status": "all" }
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "meta_campaign_id": "120210...",
      "name": "...",
      "status": "ACTIVE",
      "daily_budget": 2000,
      "created_at": "2026-..."
    }
  ]
}
```

### `POST /simple-campaign-activate`

Activates a paused campaign (campaign + ad set + ad).

**Body:**
```json
{
  "campaign_id": "120210..."
}
```

### `POST /simple-campaign-pause`

Pauses an active campaign (campaign + ad set + ad).

**Body:**
```json
{
  "campaign_id": "120210..."
}
```

### `POST /simple-campaign-insights`

Fetches performance metrics for a campaign.

**Body:**
```json
{
  "campaign_id": "120210...",
  "date_preset": "last_7d"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "impressions": "12345",
    "clicks": "456",
    "spend": "89.50",
    "ctr": "3.69",
    "cpc": "0.20",
    "actions": [...]
  }
}
```

### `POST /duplicate-campaign`

Duplicates an existing campaign with new name.

**Body:**
```json
{
  "campaign_id": "uuid",
  "new_name": "Copy of Campaign"
}
```

---

## Instagram Posts & Assets

### `POST /simple-campaign-assets`

Fetches Instagram posts for the post picker (supports all media types + pagination).

**Body:**
```json
{
  "action": "get_instagram_posts",
  "instagram_user_id": "17841400...",
  "page_id": "123456...",
  "limit": 30,
  "after": "cursor_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "17899506...",
      "caption": "Post caption",
      "media_type": "IMAGE",
      "media_url": "https://...",
      "thumbnail_url": null
    }
  ],
  "pagination": {
    "after": "next_cursor",
    "has_next_page": true
  }
}
```

---

## AI Features

### `POST /ai-suggestions`

Generates AI audience targeting suggestions based on business profile.

**Body:**
```json
{
  "business_type": "Dentista",
  "city": "Sao Paulo",
  "objective": "MESSAGES"
}
```

### `POST /ai-evaluate-metrics`

AI evaluation of campaign performance with optimization recommendations.

**Body:**
```json
{
  "campaign_id": "120210...",
  "metrics": { "impressions": 5000, "clicks": 150, "spend": 45.00 }
}
```

### `POST /apply-optimization`

Applies an AI-recommended optimization action.

**Body:**
```json
{
  "suggestion_id": "uuid",
  "action": "increase_budget"
}
```

### `POST /ai-generate-profile`

Auto-generates a campaign profile from business data.

**Body:**
```json
{
  "user_id": "uuid"
}
```

---

## Monitoring & Caching

### `POST /metrics-cache-refresh`

Refreshes campaign metrics cache (called by cron or manually).

**Body:**
```json
{
  "mode": "refresh_user",
  "user_id": "uuid"
}
```

**Modes:** `refresh_user`, `refresh_all`, `check_alerts`

### `POST /edge-log-persist`

Persists edge function logs and queries them (admin only).

**Actions:**
- `write` — Persist a log entry (service-role only)
- `list` — Query logs with filters (admin only)
- `stats` — 24h error/warning summary (admin only)

---

## OAuth & Integration

### `POST /meta-oauth-exchange`

Exchanges OAuth authorization code for access token.

**Body:**
```json
{
  "code": "AQ...",
  "redirect_uri": "https://iacamply.com/dashboard/integrations/meta-success"
}
```

### `POST /meta-whatsapp-assets`

Fetches WhatsApp Business assets for CTWA campaigns.

**Body:**
```json
{
  "action": "get_whatsapp_numbers"
}
```

### `POST /meta-whatsapp-save-selection`

Saves selected WhatsApp phone number to integration record.

---

## Payment & Subscription

### `POST /stripe-webhook` (Public)

Stripe webhook receiver. Validates HMAC-SHA256 signature.

### `POST /pagarme-webhook` (Public)

Pagar.me webhook receiver. Validates HMAC-SHA256 signature.

### `POST /asaas-webhook` (Public)

Asaas webhook receiver. Validates HMAC-SHA256 signature.

### `POST /subscription-sync`

Periodic subscription status sync with payment providers.

**Body:**
```json
{
  "mode": "sync_stale"
}
```

### `POST /check-subscription`

Checks current user's subscription status and access level.

---

## Error Response Format

All edge functions use the standardized error format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "VALIDATION_ERROR",
  "details": { "field": "dailyBudget", "min": 5 },
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTH_MISSING` | 401 | No or invalid auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `META_API_ERROR` | 502 | Meta Graph API failure |
| `PAYMENT_ERROR` | 502 | Payment provider failure |
| `DB_ERROR` | 500 | Database operation failed |
| `CONFIG_MISSING` | 400 | Missing configuration |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
