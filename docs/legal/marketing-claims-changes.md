# Alterações de textos de marketing — LGL-06 (para aprovação do cliente)

Data: 08/11/2026. Motivo: retirar afirmações que conflitam com o Contrato de Uso (`/legal/contrato`) ou com o CDC (arts. 30, 31 e 37: publicidade enganosa) e com o CONAR (publicidade comparativa e testemunhal).
Toda alteração pode ser revertida ou reescrita pelo cliente. Basta aprovar, ajustar o texto ou mandar a prova que sustenta a afirmação original (casos reais autorizados, certificados, dados de uso).

Critérios usados:
- **Suporte**: o contrato (cláusula 5) diz WhatsApp, de segunda a sexta, das 09h às 18h. O único número real no código é o de `src/pages/dashboard/Support.tsx` (`wa.me/5533998581155`).
- **"Sem juros"**: a config de produção do Pagar.me tem `free_installments = 0` e `interest_rate = 2,99`, ou seja, as parcelas têm juros. No Asaas, o código não define juros (isso depende da conta Asaas), então nada prova que o parcelamento é sem juros. Por isso troquei por "até 12x no cartão" (o máximo configurado é 12). As telas do checkout que calculam o selo "sem juros" a partir da config (`InstallmentsPicker`, `InstallmentsModal`) **não** foram alteradas.
- **Otimização "24h"**: os jobs agendados fazem sincronização, métricas e alertas a cada 10–15 min, e a verificação de conjuntos a cada hora. A aplicação de otimizações é **manual** (o usuário clica em `apply-optimization`). Por isso "monitoramento automático contínuo" está correto, mas "otimiza 24h sozinha" não está.

## Alterado (21 itens)

| # | Arquivo | Texto antigo | Texto novo |
|---|---|---|---|
| 1 | `src/pages/landing/DentistLandingPage.tsx` (preços) | Selo "Garantia de Resultados" | "Acompanhamento dos resultados no painel" |
| 2 | `src/pages/landing/DentistLandingPage.tsx` (preços) | Selo "+500 Dentistas Confiam" | Removido |
| 3 | `src/pages/landing/DentistLandingPage.tsx` (preços) | "Oferta Limitada - Últimas Vagas" | "Plano Anual" |
| 4 | `src/pages/landing/DentistLandingPage.tsx` (preços) | Botão "Garantir Minha Vaga por R$ 2.000" / "Garantir Minha Vaga" | "Assinar o Plano Anual por R$ 2.000" / "Assinar o Plano Anual" |
| 5 | `src/pages/landing/DentistLandingPage.tsx` (preços) | "12x sem juros" | "Até 12x no cartão" |
| 6 | `src/pages/landing/DentistLandingPage.tsx` (preços) | "Otimização por IA — Inteligência artificial trabalhando 24h" | "Otimização por IA — Sugestões de otimização geradas por IA" |
| 7 | `src/pages/landing/DentistLandingPage.tsx` | Seção "Resultados Reais": "+75.000 leads gerados", "4min23s para lançar uma campanha", "Até 73% menos custo por lead vs. agências", "Economia de +R$ 12 mil/ano em gestão de tráfego" | Seção removida (números sem comprovação) |
| 8 | `src/pages/landing/DentistLandingPage.tsx` | Seção "Dentistas recomendam:" com depoimentos de "Dr. Matheus Ferreira" e "Dra. Luana Tavares" | Seção removida. Pode voltar só com casos reais e autorização por escrito |
| 9 | `src/pages/landing/DentistLandingPage.tsx` (comparativo) | "**Economize cerca de 90–95%** em gestão mensal comparado ao mercado, com pacote completo por menos de R$ 170/mês" | "Valor fixo, sem taxa por lead, com pacote completo por menos de R$ 170/mês" |
| 10 | `src/pages/landing/DentistLandingPage.tsx` (comparativo) | "Com Camply, você economiza milhares de reais por ano e ainda tem resultados superiores com IA especializada." | "Com a Camply, você paga um valor fixo e acompanha seus anúncios em um só lugar, com sugestões de IA especializada." |
| 11 | `src/pages/landing/DentistLandingPage.tsx` e `src/pages/Index.tsx` | Seção `MetaCertificationsSection`: selo "Meta Certified", "Certificação oficial que garante resultados", 4 selos de certificação Meta | Seção removida das duas páginas. O componente continua no repositório e pode voltar se o cliente tiver os certificados válidos e o texto deixar claro que são de pessoas da equipe, não da plataforma |
| 12 | `src/components/landing/HeroSection.tsx` | "Sem risco de desperdiçar dinheiro" | "Você define e controla o orçamento" |
| 13 | `src/components/landing/CTASection.tsx` | "Sem riscos" | "Orçamento sob seu controle" |
| 14 | `src/components/ia/IAHeroSection.tsx` | "Até 80% mais econômico" / "Otimização 24h por dia" | "Valor fixo de assinatura" / "Monitoramento automático contínuo" |
| 15 | `src/components/ia/IAWhatIsSection.tsx` | Status "Ativo 24/7" | "Monitorando" |
| 16 | `src/components/landing/ComparisonTable.tsx` | "Até 5x mais barato" / "3x mais caro" / "5x mais caro" / "24h por dia trabalhando" / "Nunca para de otimizar" | "Valor fixo mensal" / "Valor varia por profissional" / "Valor varia por escopo" / "Monitoramento automático contínuo" / "Sugestões de otimização com IA" |
| 17 | `src/components/landing/DentistComparisonCarousel.tsx` | "Até 10x mais barato" / "IA 24/7 em tempo real" / "Nunca para de melhorar" | "Valor fixo" / "Monitoramento automático" / "Sugestões de otimização com IA" |
| 18 | `src/components/checkout/AsaasCheckoutSection.tsx` | "Pagamento seguro • Parcelamento sem juros" e "✓ Suporte 24/7" | "Pagamento seguro • Parcelamento em até 12x no cartão" e "✓ Suporte por WhatsApp em horário comercial" |
| 19 | `src/components/checkout/PlanSelector.tsx`, `src/components/subscription/SubscriptionPlans.tsx`, `src/pages/subscription/SubscriptionPlans.tsx`, `src/pages/plans/AnnualPlanPage.tsx` (título, meta description e card) | "12x … sem juros", "12x R$ 208,25 sem juros", "Parcelamento em 12x sem juros", "sem juros no cartão" | "até 12x … no cartão", "Parcelamento em até 12x no cartão", "no cartão de crédito" |
| 20 | `src/pages/checkout/Cancel.tsx`, `src/pages/checkout/Success.tsx` | Número falso `wa.me/5511999999999` "(11) 99999-9999" | Número de suporte já usado em `Support.tsx`: `wa.me/5533998581155` "(33) 99858-1155". **Cliente: confirme o número** |
| 21 | `src/hooks/useAIContentGeneration.ts` (título sugerido de anúncio, quando a IA falha) | "Resultados garantidos para sua empresa" | "Conheça nossos serviços". Antes, o próprio produto sugeria ao cliente uma promessa de resultado |

## Não alterado: decisão do cliente (veja também `client-legal-checklist.md`)

| Arquivo | Texto | Por que precisa de decisão |
|---|---|---|
| `DentistLandingPage.tsx` (preços) | "DE R$ 4.500" riscado, "Economia de R$ 2.500 (55% OFF)" | Preço "de" que nunca foi praticado é publicidade enganosa (CDC art. 37). Só pode ficar se esse preço foi cobrado de fato. Os preços divergem entre as páginas (R$ 2.000/ano, R$ 2.499,99/ano, 12x R$ 249,99, 12x R$ 208,25, R$ 397,99/mês, R$ 249/mês, "~R$ 167/mês"). Pendente da decisão de preços (Apêndice C #2 / PAY-15) |
| `AnnualPlanPage.tsx` | "De R$ 4.199,88" riscado, "Economize R$ 1.200", "O Plano Mais Escolhido pelos Profissionais", "MAIS POPULAR" | A conta só fecha se o plano mensal de R$ 349,99 existir. "Mais escolhido" exige dado real |
| `DentistLandingPage.tsx` | "PLANO MAIS ESCOLHIDO", "Cancelamento sem burocracias." | Popularidade sem dado. O cancelamento conflita com a cláusula 9.1 do contrato (rescisão antecipada não isenta as parcelas restantes) |
| `AsaasCheckoutSection.tsx`, `MonthlyPlanPage.tsx` (meta, "Cancele quando quiser • Sem fidelidade", "Cancele Quando Quiser"), `onboarding/PlanSelection.tsx`, `onboarding/Welcome.tsx`, `ia/IAFAQSection.tsx` ("Você não fica preso em contrato"), `subscription/SubscriptionPlans.tsx` ("Cancele a qualquer momento"), `learning/FAQ.tsx` ("Cobramos mensalmente… cancelar a qualquer momento sem multas"; "14 dias grátis") | "Cancele quando quiser" e textos parecidos | O contrato diz "contratação exclusivamente anual" (2.3) e prevê rescisão antecipada com parcelas devidas (9.1). Defina se existe plano mensal e reescreva o contrato ou os textos |
| `pages/subscription/SubscriptionPlans.tsx` | "2 meses grátis", "Suporte VIP dedicado", "Consultoria estratégica mensal" | Confirme se esses benefícios existem de fato |
| `AsaasCheckoutSection.tsx`, `PlanSelector.tsx`, `subscription/SubscriptionPlans.tsx`, `onboarding/PlanSelection.tsx`, `checkout/Success.tsx` | "Suporte prioritário", "API personalizada" | Confirme se existem (não encontrei API pública no código) |
| `ia/IAEconomySection.tsx` | "O mesmo nível de resultado, com muito menos custo.", disponibilidade "24h por dia, 7 dias" | Mantive "24h", que se refere à plataforma (SaaS) estar acessível. "Mesmo nível de resultado" é uma promessa comparativa: sugiro reescrever |
| `ia/IAFAQSection.tsx`, `DentistLandingPage.tsx` (FAQ e seção "O que é") | "começa a otimizar automaticamente", "otimiza seus anúncios em tempo real", "a IA já sugere otimizações automáticas" | A otimização é aplicada manualmente pelo usuário. Sugiro "sugere otimizações que você aplica com um clique" |
| `DentistLandingPage.tsx` (seção ética) | "100% alinhados à ética odontológica", "seguem rigorosamente o Código de Ética do CFO e a Resolução 196/2019" | Confirme se existe validação jurídica ou de um profissional para esses textos |
| `ia/IASupportSection.tsx` | "Suporte Humano … Online" (indicador fixo) | O indicador "Online" é fixo, não reflete o horário real de atendimento |
| `pages/checkout/ParceladoExample.tsx` (rota privada de exemplo) | "Sem juros até 3x" | É uma página de exemplo para desenvolvimento. Sugiro remover a rota |
| `pages/checkout/Parcelado.tsx` | "Parcelamento sem juros até {free_installments ‖ 1}x" | Usa a config (hoje `0`, então mostra "até 1x"). É lógica de checkout: não alterei |
