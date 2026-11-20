// Bot texts (pt-BR). Final wording is to be approved by the client (plan §16).
import { brl } from './parse.ts';

export const SITE = () => (Deno.env.get('SITE_URL') || 'https://iacamply.com').replace(/\/+$/, '');

export const T = {
  menu: (name: string) => `Oi${name ? `, ${name}` : ''}! 👋 Sou o assistente da Camply. O que você quer fazer?`,
  help: () =>
    'Comigo você cria campanhas de anúncio que levam clientes para o seu WhatsApp:\n\n' +
    '• *Criar campanha*: envie a foto ou vídeo (ou o link de um post do seu Instagram), a região e o valor por dia.\n' +
    '• *Minhas campanhas*: veja gasto, conversas e custo por conversa.\n\n' +
    'Comandos a qualquer momento: *menu*, *cancelar*, *ajuda*, *parar*.',
  unknownNumber: () =>
    `Olá! Este é o WhatsApp da Camply. Para criar campanhas por aqui, conecte este número na sua conta: ${SITE()}/dashboard/settings?tab=whatsapp`,
  linked: (masked: string) => `✅ Pronto! Este WhatsApp (${masked}) foi conectado à sua conta Camply.`,
  linkInvalid: () => `Esse código não é válido ou já expirou. Gere um novo no painel da Camply: ${SITE()}/dashboard/settings?tab=whatsapp`,
  linkTooMany: () => 'Muitas tentativas de código. Aguarde uma hora e gere um novo código no painel.',
  linkAlreadyOther: () => 'Este WhatsApp já está conectado a outra conta Camply. Desconecte por lá antes (Configurações → WhatsApp).',
  unlinked: () => `Este WhatsApp foi desconectado da sua conta Camply. Para usar de novo, conecte em ${SITE()}/dashboard/settings?tab=whatsapp`,
  optedOut: () => 'Tudo bem, não vou mais te enviar mensagens. Para voltar, envie *voltar*.',
  optedIn: () => 'Que bom te ver de volta! 😊',
  accountBlocked: (msg: string) => msg,
  noMeta: () => `Antes de criar campanhas, conecte sua conta da Meta (Facebook/Instagram): ${SITE()}/dashboard/integrations`,
  noPageWhatsapp: (page: string) =>
    `A Página *${page}* não tem um WhatsApp conectado, e o anúncio precisa dele para receber as conversas. ` +
    'Conecte o WhatsApp à Página no Facebook (Configurações da Página → WhatsApp) e tente de novo.',
  askPage: () => 'Qual Página do Facebook vai anunciar?',
  askMedia: () =>
    'Me envie a *foto ou vídeo* do anúncio 📸\n\n' +
    'Dica: envie como *documento* (📎 → Documento) para manter a qualidade.\n' +
    'Ou cole o *link de um post* do seu Instagram.',
  mediaReceiving: () => 'Recebendo sua mídia… ⏳',
  mediaUnsupported: () => 'Esse tipo de arquivo não serve para anúncio. Envie uma *foto* (JPG/PNG) ou um *vídeo* (MP4).',
  mediaTooLarge: () => 'Esse arquivo é grande demais (máx. 50 MB). Envie um vídeo menor ou mais curto.',
  mediaError: () => 'Não consegui receber esse arquivo. Pode enviar de novo?',
  igStory: () => 'Esse link é de um Story. Envie o link de um *post* ou *Reel* do seu Instagram, ou uma foto/vídeo.',
  igNoAccount: () => 'Sua Página não tem uma conta do Instagram conectada. Envie uma foto ou vídeo para o anúncio.',
  igNotFound: (user: string | null) =>
    `Não achei esse post${user ? ` no Instagram @${user}` : ''} ligado à sua Página. ` +
    'Só dá para usar posts recentes da sua própria conta. Envie outro link ou uma foto/vídeo.',
  igError: () => 'Não consegui consultar o Instagram agora. Tente de novo ou envie a foto/vídeo.',
  igFound: (user: string | null, hasCaption: boolean) =>
    `Vou usar este post${user ? ` do @${user}` : ''}.` +
    (hasCaption ? ' O texto do anúncio pode ser a *legenda do post* ou um *texto novo* escrito pela IA.' : ' Vou escrever o texto do anúncio com a IA.') +
    '\n\nObs.: o anúncio usa a foto/vídeo do post, mas as curtidas e comentários do post original não aparecem nele.',
  askLocation: () =>
    'Onde você quer anunciar? 📍\n\nToque no botão abaixo para enviar a localização, ou *digite o nome da cidade*.',
  cityNone: (q: string) => `Não encontrei a cidade "${q}". Confira o nome (ex.: *Governador Valadares*) ou envie a localização 📍.`,
  cityPick: () => 'Encontrei estas cidades. Qual delas?',
  cityError: () => 'Não consegui buscar cidades agora. Tente de novo em instantes ou envie a localização 📍.',
  askRadiusPin: () => 'Qual o raio ao redor desse ponto?',
  askRadiusCity: () => 'Qual o raio ao redor da cidade?',
  radiusPinRange: () => 'Para um ponto, o raio vai de 1 a 80 km. Escolha um botão ou digite um número.',
  radiusCityMin: () => 'Para cidades o mínimo da Meta é 17 km. Para um bairro, envie a localização 📍 em vez do nome da cidade.',
  radiusCityRange: () => 'Para cidades, o raio vai de 17 a 80 km. Escolha um botão ou digite um número.',
  askBudget: () => 'Quanto você quer investir *por dia*?',
  budgetMin: () => 'O mínimo é R$ 30,00 por dia.',
  budgetMax: (max: number) => `Pelo WhatsApp o máximo é ${brl(max)} por dia. Para valores maiores, use o painel da Camply.`,
  budgetInvalid: () => 'Digite só o valor por dia, por exemplo *50* ou *R$ 70,00*.',
  askDuration: () => 'Por quanto tempo a campanha vai rodar?',
  durationInvalid: () => 'Escolha um dos botões: sem data de término, 7 dias ou 30 dias.',
  writingCopy: () => 'Escrevendo o texto do anúncio… ✍️',
  review: (r: {
    title: string; text: string; place: string; radius: number; budget: number; duration: 0 | 7 | 30; page: string; creative: string;
  }) =>
    `*Resumo da campanha*\n\n` +
    `📣 *${r.title}*\n${r.text}\n\n` +
    `🖼️ ${r.creative}\n` +
    `📍 ${r.place} (raio de ${r.radius} km)\n` +
    `💰 ${brl(r.budget)} por dia\n` +
    `🗓️ ${r.duration ? `${r.duration} dias` : 'Sem data de término'}\n` +
    `📄 Página: ${r.page}\n\n` +
    'A campanha será criada *pausada*, sem gastar nada até você ativar.',
  askEditCopy: () =>
    'Envie o novo texto do anúncio (até 1.000 caracteres).\nSe quiser trocar o título também, escreva o título na *primeira linha* (até 40 caracteres).',
  copyTooLong: () => 'O texto passou de 1.000 caracteres. Pode resumir?',
  creating: () => 'Criando sua campanha na Meta… vídeos podem levar até 2 minutos. ⏳',
  stillCreating: () => 'Ainda estou criando sua campanha, aguarde só mais um pouquinho. ⏳',
  stillActivating: () => 'Estou ativando sua campanha, aguarde um instante. ⏳',
  created: (name: string, budget: number) =>
    `✅ Campanha *${name}* criada (pausada).\n\nQuer ativar agora? Ela começa a gastar até ${brl(budget)} por dia.`,
  createFailed: (msg: string) => `❌ A Meta não aceitou a campanha: ${msg}\n\nQuer tentar de novo?`,
  createQueued: (msg: string) => `⚠️ ${msg}`,
  createUnknown: () =>
    `⚠️ Não consegui confirmar se a campanha foi criada. Confira em ${SITE()}/dashboard/campaigns antes de tentar de novo.`,
  keptPaused: () => 'Tudo certo, a campanha ficou *pausada*. Você pode ativar quando quiser pelo painel ou criando outra por aqui.',
  activated: () => '🚀 Campanha ativada! A Meta vai revisar o anúncio, o que normalmente leva até 24 horas.',
  activatedReview: () => '🚀 Campanha ativada e *em análise pela Meta*. Normalmente leva até 24 horas.',
  activateFailed: (msg: string) => `❌ Não foi possível ativar: ${msg}`,
  cancelled: () => 'Campanha cancelada. Nada foi criado. 👍',
  cantCancelNow: () => 'Agora não dá para cancelar: a campanha já está sendo enviada para a Meta. Aguarde a resposta.',
  expired: () => 'Sua conversa anterior expirou. Vamos começar de novo?',
  retry: (base: string, n: number) => (n >= 3 ? `${base}\n\nSe preferir recomeçar, digite *menu*.` : base),
  statusNone: () => 'Você ainda não tem campanhas. Que tal criar a primeira? 😊',
  statusHeader: () => '*Suas campanhas (últimos 7 dias)*',
  statusError: () => 'Não consegui carregar suas campanhas agora. Tente de novo em instantes.',
};

export const STATUS_LABEL: Record<string, string> = {
  active: 'ativa', paused: 'pausada', pending_review: 'em análise', finished: 'finalizada',
  draft: 'rascunho', error: 'com problema', archived: 'arquivada', deleted: 'excluída',
};
