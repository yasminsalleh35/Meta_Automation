import { z } from 'zod';

const placementOptions = [
  'facebook_feed',
  'facebook_marketplace', 
  'facebook_video_feeds',
  'facebook_right_column',
  'instagram_feed',
  'instagram_stories',
  'instagram_reels',
  'instagram_explore'
] as const;

export const zCampaignProfileForm = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9\-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  label: z.string().min(2).max(120),
  description: z.string().max(1000).optional().nullable(),
  age_min: z.number().int().min(13).max(65),
  age_max: z.number().int().min(13).max(65),
  genders: z.enum(['all', 'male', 'female']),
  placements_mode: z.enum(['automatic', 'manual']),
  placements: z.array(z.enum(placementOptions)).default([]),
  interests: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1)
  })).default([]),
  is_active: z.boolean().default(true),
  // New flags for conditional sections  
  show_strategic_reports: z.boolean().default(false),
  show_dental_specialties: z.boolean().default(false),
  // Language Targeting
  enable_language_targeting: z.boolean().default(false),
  languages: z.array(z.string().regex(/^[a-z]{2}_[A-Z]{2}$/, 'Formato inválido. Use: pt_BR, en_US, etc.')).default([]),
});