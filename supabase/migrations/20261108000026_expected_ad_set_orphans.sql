-- =============================================
-- Audit (2026-11-08): auto-verify-ad-sets falhava 5/5 a cada hora.
-- expected_ad_set_settings só tem 9 linhas de teste de jun/2025, todas sem user_id
-- (algumas com ids falsos tipo 'adset_<timestamp>'). Sem dono não há token Meta para
-- verificar, e como a falha não tirava o pending, o cron repetia para sempre.
-- Marca essas linhas órfãs como ERROR (a function agora também faz isso em falhas).
-- =============================================

update public.expected_ad_set_settings
   set verification_status     = 'ERROR',
       is_pending_verification = false,
       last_verified_at        = now(),
       error_details           = jsonb_build_object('message', 'Ad set sem dono (dado de teste legado)')
 where user_id is null
   and is_pending_verification = true;
