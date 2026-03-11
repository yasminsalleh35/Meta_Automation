-- Allow authenticated users to read the Mapbox token from global_settings
-- This is safe because Mapbox public tokens are meant to be used in the frontend
-- Other settings remain protected by existing admin-only policies

CREATE POLICY "Anyone can view mapbox token"
ON public.global_settings
FOR SELECT
TO authenticated
USING (setting_key = 'mapbox_token');

-- Comment: Mapbox tokens are public by design and need to be accessible
-- to all users for map functionality in campaign creation