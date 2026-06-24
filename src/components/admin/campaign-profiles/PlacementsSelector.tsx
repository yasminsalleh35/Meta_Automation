import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { PlacementType } from '@/types/campaignProfiles';

const OPTIONS: { key: PlacementType; label: string }[] = [
  { key: 'facebook_feed', label: 'Facebook Feed' },
  { key: 'facebook_marketplace', label: 'Facebook Marketplace' },
  // 'facebook_video_feeds' removido: posicionamento descontinuado na Meta API v23 (subcode 2490562).
  { key: 'facebook_right_column', label: 'Facebook Right Column' },
  { key: 'instagram_feed', label: 'Instagram Feed' },
  { key: 'instagram_stories', label: 'Instagram Stories' },
  { key: 'instagram_reels', label: 'Instagram Reels' },
  { key: 'instagram_explore', label: 'Instagram Explore' },
];

interface PlacementsSelectorProps {
  value: PlacementType[];
  onChange: (value: PlacementType[]) => void;
  disabled?: boolean;
}

export function PlacementsSelector({ value, onChange, disabled }: PlacementsSelectorProps) {
  const toggle = (key: PlacementType) => {
    if (value.includes(key)) {
      onChange(value.filter(v => v !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map(opt => (
        <div key={opt.key} className="flex items-center space-x-2">
          <Checkbox
            id={opt.key}
            disabled={disabled}
            checked={value.includes(opt.key)}
            onCheckedChange={() => toggle(opt.key)}
          />
          <Label htmlFor={opt.key} className="text-sm">
            {opt.label}
          </Label>
        </div>
      ))}
    </div>
  );
}