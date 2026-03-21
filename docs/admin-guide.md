# Camply — Guia do Administrador

## Acessando o Painel Admin

- Login com conta que possui `role: admin` nos metadados do Supabase
- Acesse `/admin` no navegador
- O menu lateral mostra todas as seções administrativas

---

## Seções do Painel Admin

### Dashboard (`/admin`)
Visão geral com:
- Total de usuários, assinantes ativos, novos este mês
- Receita recente

### Usuários (`/admin/users`)
- Lista todos os usuários cadastrados
- Ver detalhes: email, plano, data de cadastro
- Alterar role (admin/user)

### Assinaturas (`/admin/subscriptions`)
- Lista todas as assinaturas ativas/inativas
- Status de pagamento, próxima cobrança
- Link para portal do cliente

### Planos (`/admin/plans`)
- Gerenciar planos disponíveis (nome, preço, recursos)
- Sincronizar com Pagar.me/Stripe

---

## Integrações de Pagamento

### Pagar.me (`/admin/integrations/pagarme`)
- Configurar chaves API (test/live)
- Sincronizar planos com Pagar.me
- Ver status da conexão

### Asaas (`/admin/integrations/asaas`)
- Configurar token API
- Testar conexão
- Gerenciar checkout público

### Stripe
- Configurado via variáveis de ambiente
- Webhook: `STRIPE_WEBHOOK_SECRET`

---

## Meta Ads

### Configuração (`/admin/integrations/meta-ads`)
- App ID, App Secret, redirect URIs
- Verificar status do app (Development/Live mode)

### Meta Test Lab (`/admin/meta-test-lab`)
- Testar criação de campanha, ad set, creative, ad
- Debug da API Meta com logs detalhados

### Contingência (`/admin/contingency`)
- Gerenciar campanhas com problemas
- Retry automático para campanhas com wa.me link quebrado
- Sync manual de campanhas

---

## IA e Conteúdo

### Integração IA (`/admin/ai-integration`)
- Configurar chave OpenAI / DeepSeek
- Selecionar modelo (GPT-4o, DeepSeek, etc.)

### Monitoramento IA (`/admin/ai-monitoring`)
- Ver sugestões geradas, logs de otimização
- Taxa de aceitação de sugestões

### IA para Mídia (`/admin/ai-media`)
- Configurar geração de imagens com IA

---

## Negócios e Leads

### Negócios dos Clientes (`/admin/client-businesses`)
- Ver perfis de negócio preenchidos pelos usuários
- Dados usados pela IA para gerar sugestões

### Campanhas dos Clientes (`/admin/client-campaigns`)
- Ver todas as campanhas de todos os usuários
- Filtrar por status, usuário, data

### Perfis de Campanha (`/admin/campaign-profiles`)
- Ver perfis auto-gerados pela IA
- Verificar targeting, interesses, orçamento sugerido

### Leads (`/admin/leads`)
- Leads capturados via quiz/formulário

### Quizzes (`/admin/quizzes`)
- Criar e gerenciar quizzes de captação de leads
- Ver respostas e pontuação

---

## Monitoramento & Logs

### Logs de Sistema (`/admin/edge-logs`)
- Logs de erro e aviso de todas as edge functions
- Filtrar por função, nível (error/warn/info)
- Detalhes expandíveis com JSON completo
- Estatísticas de 24h: total de erros, funções mais problemáticas

### Como interpretar os logs
- **Error (vermelho)** — falha que impediu a operação
- **Warning (amarelo)** — problema contornado, mas atenção necessária
- **Info (azul)** — informativo (só aparece se persistido manualmente)

### Códigos de erro comuns
| Código | Significado | Ação |
|--------|-------------|------|
| `META_API_ERROR` | Erro na API do Meta | Verificar token e permissões |
| `VALIDATION_ERROR` | Dados inválidos enviados | Verificar frontend |
| `AUTH_MISSING` | Token não enviado | Verificar sessão do usuário |
| `RATE_LIMITED` | Muitas chamadas à API | Aguardar ou verificar cache |
| `CONFIG_MISSING` | Configuração ausente | Verificar variáveis de ambiente |

---

## Configurações

### Configurações Gerais (`/admin/settings`)
- Configurações globais do sistema

### Mapbox (`/admin/settings/mapbox`)
- Token Mapbox para busca geográfica
- Configurações de geocoding

---

## Operações de Manutenção

### Sync de Assinaturas
Executar manualmente se houver divergência:
```
POST /functions/v1/subscription-sync
Body: { "mode": "sync_stale" }
```

### Refresh de Métricas
Forçar atualização do cache de métricas:
```
POST /functions/v1/metrics-cache-refresh
Body: { "mode": "refresh_all" }
```

### Limpeza de Logs
Logs mais antigos que 30 dias podem ser removidos via SQL:
```sql
DELETE FROM edge_function_logs WHERE created_at < now() - interval '30 days';
```

---

## Variáveis de Ambiente Necessárias

| Variável | Onde configurar | Descrição |
|----------|----------------|-----------|
| `SUPABASE_URL` | Supabase Dashboard | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Chave service-role |
| `META_APP_ID` | Supabase Secrets | ID do Meta App |
| `META_APP_SECRET` | Supabase Secrets | Secret do Meta App |
| `OPENAI_API_KEY` | Supabase Secrets | Chave OpenAI para IA |
| `STRIPE_WEBHOOK_SECRET` | Supabase Secrets | Secret do webhook Stripe |
| `PAGARME_API_KEY` | Supabase Secrets | Chave API Pagar.me |
| `ASAAS_API_KEY` | Supabase Secrets | Chave API Asaas |
| `RESEND_API_KEY` | Supabase Secrets | Chave API Resend (emails) |
| `ALLOWED_ORIGINS` | Supabase Secrets | Origins CORS (comma-separated) |
