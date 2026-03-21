# Camply — Production Checklist

## Pre-Launch Checklist

### Infrastructure
- [ ] Custom domain `iacamply.com` configured on Netlify with SSL
- [ ] Supabase project on Pro plan (for higher function limits)
- [ ] CORS origins restricted to `iacamply.com` + `camplyia.netlify.app`
- [ ] All environment secrets set in Supabase
- [ ] pg_cron extension enabled for scheduled functions

### Meta Ads
- [ ] Meta App switched to **Live Mode**
- [ ] App Review completed for all required permissions
- [ ] OAuth redirect URI matches production domain
- [ ] Test campaign creation with real ad account
- [ ] Verify CTWA ad delivers messages to correct WhatsApp number

### Payments
- [ ] Stripe webhook endpoint configured and tested
- [ ] Pagar.me webhook endpoint configured and tested
- [ ] Asaas webhook endpoint configured and tested
- [ ] Webhook secrets rotated from test keys to live keys
- [ ] Test full subscription flow: signup → payment → access
- [ ] Test webhook idempotency (replay same event)

### Security
- [ ] CSP headers in `index.html` reviewed
- [ ] CORS headers restrict to known origins
- [ ] Rate limiting active on critical functions
- [ ] Webhook HMAC validation active on all 3 providers
- [ ] RLS enabled on all tables
- [ ] Service role key NOT exposed to frontend
- [ ] `.env` file NOT committed to git
- [ ] No hardcoded secrets in source code

### Database
- [ ] All migrations applied successfully
- [ ] Indexes created for performance-critical queries
- [ ] RLS policies tested (user can't read other users' data)
- [ ] Backups enabled (Supabase Pro does this automatically)
- [ ] Log cleanup cron job scheduled

### Frontend
- [ ] Production build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All tests pass (`npm test`)
- [ ] Code splitting active for heavy routes (Monitoring, AdminEdgeLogs)
- [ ] Images and assets optimized
- [ ] favicon and meta tags set
- [ ] `robots.txt` configured

### Monitoring
- [ ] Metrics cache refresh cron running (every 15 min)
- [ ] Subscription sync cron running (every 6 hours)
- [ ] Alert check cron running (every 30 min)
- [ ] Admin log viewer accessible at `/admin/edge-logs`
- [ ] Monitoring dashboard accessible at `/dashboard/monitoring`

---

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor `/admin/edge-logs` for unexpected errors
- [ ] Verify webhook deliveries in Stripe/Pagar.me dashboards
- [ ] Confirm cron jobs executing (check `cron.job_run_details`)
- [ ] Test user signup → payment → campaign creation full flow
- [ ] Check Meta API rate limit usage in monitoring dashboard

### First Week
- [ ] Review error trends in edge logs
- [ ] Verify metrics cache freshness (no stale data)
- [ ] Confirm AI suggestions are generating correctly
- [ ] Check subscription renewals processed correctly
- [ ] Monitor disk usage on Supabase (storage, database)

### Ongoing
- [ ] Weekly: Review edge function error patterns
- [ ] Monthly: Rotate webhook secrets
- [ ] Monthly: Review and remove unused edge functions
- [ ] Quarterly: Update Meta Graph API version
- [ ] Quarterly: Update npm dependencies

---

## Rollback Plan

### Frontend
```bash
# Netlify keeps all deploys — rollback via dashboard or:
npx netlify-cli rollback
```

### Edge Functions
```bash
# Re-deploy previous version
git checkout <previous-commit>
npx supabase functions deploy --project-ref <REF>
```

### Database
```bash
# Supabase maintains point-in-time recovery (Pro plan)
# Contact Supabase support for database restore
```

---

## Emergency Contacts

| Service | Dashboard |
|---------|-----------|
| Supabase | supabase.com/dashboard |
| Netlify | app.netlify.com |
| Meta Business | business.facebook.com |
| Stripe | dashboard.stripe.com |
| Pagar.me | dashboard.pagar.me |
| Asaas | www.asaas.com |
