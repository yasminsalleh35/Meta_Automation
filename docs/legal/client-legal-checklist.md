# Checklist jurídico — itens que o cliente / advogado precisa fornecer ou aprovar

Referências: `docs/audit-fix-plan.md` §9 (LGL-01…06) e Apêndice C #2 e #6. Data: 08/11/2026.
Nada abaixo foi inventado no site. Quando falta uma informação, o texto antigo foi mantido.

## 1. Identificação do controlador (LGL-01)

- [ ] **Razão social e CNPJ do controlador.** A Política de Privacidade agora cita **CAMPLY GROUP, CNPJ 63.626.513/0001-22**. Esses dados vieram do Contrato de Uso já publicado (`src/pages/legal/UsageContract.tsx`). Confirme se é a pessoa jurídica correta. Informe também o endereço da sede, que hoje não aparece em nenhuma página.
- [ ] **Encarregado (DPO), LGPD art. 41.** Informe o nome do Encarregado e um e-mail no domínio da empresa (ex.: `privacidade@iacamply.com`).
  - ⚠️ Hoje o contato publicado na Política, nos Termos e em `EmailConfirmation.tsx` é um **Gmail pessoal (`jefte.pcosta@gmail.com`)**. Mantive o endereço até o cliente mandar o novo. Um e-mail pessoal não serve como canal do Encarregado.
- [ ] **Foro.** Os Termos dizem "comarca de Governador Valadares, MG" e o Contrato diz "domicílio da CONTRATADA". Unifique. Confirme também com o advogado se a cláusula vale para quem é consumidor (CDC art. 101, I).

## 2. Bases legais por finalidade (LGPD art. 7º): RASCUNHO para o advogado confirmar

Não publiquei essas bases no site porque precisam de validação jurídica. Proposta:

| Finalidade | Dados | Base legal proposta (art. 7º) |
|---|---|---|
| Cadastro, login e prestação do serviço (campanhas, relatórios, integração Meta) | Conta, negócio, ativos Meta, campanhas, mídias | V: execução de contrato |
| Sugestões e análises por IA (DeepSeek/OpenAI) com dados do negócio e das campanhas | Negócio, métricas | V: execução de contrato (é funcionalidade contratada). Avaliar a necessidade de aviso destacado por causa da transferência para a China/EUA |
| Pagamentos e cobrança (Pagar.me, Asaas) | Cobrança, CPF/CNPJ, endereço | V: execução de contrato; II: obrigação legal (fiscal) |
| Guarda de dados fiscais após o encerramento | Pagamentos | II: obrigação legal |
| E-mails transacionais (Resend) | E-mail, nome | V: execução de contrato |
| E-mails de marketing / newsletter (LGL-04) | E-mail | I: consentimento (opt-in, desligado por padrão) |
| Quiz/formulário público: proposta e contato comercial | Nome, WhatsApp, e-mail, empresa, respostas, UTM | I: consentimento (checkbox obrigatório, já implementado em `/quiz` e `/quizz/:slug`). Alternativa: IX (legítimo interesse), mas exige LIA |
| Qualificação automática do lead por IA (`quiz-lead-scoring`) | Respostas do quiz | I: consentimento (incluir a menção à IA no texto do checkbox?) ou IX: legítimo interesse com LIA |
| Segurança, prevenção a fraude e spam, logs | IP, dispositivo, logs | IX: legítimo interesse; II: Marco Civil art. 15 (registros de acesso por 6 meses) |
| Cookies de análise e marketing (nenhum ativo hoje) | Identificadores online | I: consentimento (banner LGL-02) |
| Defesa em processos | Todos os necessários | VI: exercício regular de direitos |

- [ ] Confirmar ou ajustar cada linha e decidir se a tabela vai para a Política publicada.
- [ ] Transferência internacional (art. 33): confirmar o mecanismo (cláusulas contratuais padrão / termos dos fornecedores). O provedor de IA **ativo hoje é o DeepSeek (China)** (`ai_configurations`).
- [ ] Dados de saúde: o produto atende clínicas e dentistas. Confirmar que nenhum fluxo coleta dado sensível de paciente. Pelo código, as conversas de WhatsApp não passam pela Camply. Mesmo assim, o campo livre "descrição do negócio" vai para a IA.

## 3. Retenção (LGL-01)

Publicado na Política (a partir do código):
- Leads de quiz e formulário são anonimizados após 2 anos (`supabase/migrations/20261108000016_anonymize_old_leads.sql`, job mensal).
- Exclusão de conta: desativação imediata, 30 dias de carência e depois exclusão definitiva (LGL-03, em implementação).
- Dados fiscais: "pelo prazo exigido pela legislação fiscal"; logs: "prazo mínimo do Marco Civil".

- [ ] Confirmar os prazos e definir números exatos (ex.: 5 anos para dados fiscais, 6 meses para logs de acesso).
- [ ] O texto antigo dizia "dados de campanhas mantidos por até 5 anos". Removi porque não existe rotina que faça isso. Defina se querem esse prazo (e então ele precisa ser implementado).

## 4. Contrato × marketing: "cancele quando quiser" (LGL-06)

O Contrato de Uso diz:
- 2.3: "A contratação é realizada exclusivamente no formato anual";
- 9.1: a rescisão antecipada **não isenta as parcelas restantes**.

Mas o site oferece "Plano Mensal" e diz "Cancele quando quiser / Sem fidelidade / sem multas" em vários lugares (lista completa em `marketing-claims-changes.md`, seção "Não alterado").

- [ ] Decidir: existe plano mensal sem fidelidade? Se sim, o contrato precisa de uma versão ou cláusula para o mensal. Se não, os textos de cancelamento livre precisam sair.
- [ ] Direito de arrependimento (CDC art. 49): 7 dias para compras online. Incluir no contrato e nos Termos, com a forma de exercer.
- [ ] Termos 5.3 foi ajustado para "solicitar o cancelamento pelo painel; no plano anual, as condições de rescisão seguem o Contrato de Uso". Aprovar.
- [ ] Preços oficiais (Apêndice C #2): hoje há pelo menos 7 preços diferentes nas páginas, e preços "de" riscados sem histórico real ("DE R$ 4.500", "De R$ 4.199,88").
- [ ] Parcelamento: a config do Pagar.me cobra juros (2,99% a.m., 0 parcelas sem juros). Por isso, "sem juros" saiu de todos os textos de marketing. Se no Asaas o parcelamento for sem juros para o cliente, informe para restaurar o texto apenas onde o checkout é Asaas.

## 5. Aprovação de textos

- [ ] **Política de Privacidade** (`/legal/privacy`, `src/pages/legal/PrivacyPolicy.tsx`): reescrita com categorias de dados, finalidades, IA, tabela de operadores (Supabase, Netlify, Meta, Pagar.me, Asaas, DeepSeek/OpenAI, Resend, Mapbox), transferência internacional, retenção, direitos (Configurações → "Exportar meus dados" / "Excluir minha conta") e cookies.
- [ ] **Termos de Uso** (`/legal/terms`): 5.2 (Stripe → Pagar.me e Asaas), 5.3 (cancelamento × contrato), nova cláusula 9 (remete à Política).
- [ ] **Banner de cookies** (LGL-02): textos do aviso e das categorias "Essenciais / Análise / Marketing".
- [ ] **Texto do consentimento do quiz público** (`/quizz/:slug`, LGL-05): "Autorizo o contato… análise das minhas respostas e elaboração de uma proposta; contato comercial pelos canais informados".
  - O texto do `/quiz` também inclui "envio de conteúdos relacionados ao marketing odontológico" no mesmo checkbox. O advogado deve avaliar se o marketing precisa de um checkbox separado (consentimento granular).
- [ ] **Cada texto de marketing alterado**: tabela "Alterado (21 itens)" em `docs/legal/marketing-claims-changes.md`.
- [ ] **Número de suporte** `(33) 99858-1155`: passou a ser usado também nas páginas de sucesso e cancelamento do checkout, no lugar do número falso. Confirmar.
- [ ] **Certificações Meta**: se forem certificados reais de pessoas da equipe, enviar nome do titular e validade para reescrever a seção sem sugerir "garantia de resultado" nem certificação da plataforma.
- [ ] **Depoimentos e números** ("+500 dentistas", "+75.000 leads", depoimentos de Dr. Matheus / Dra. Luana): só voltam com prova e autorização por escrito.
