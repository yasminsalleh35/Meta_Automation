-- Add account_id field to pagarme_config table
ALTER TABLE public.pagarme_config 
ADD COLUMN account_id text;