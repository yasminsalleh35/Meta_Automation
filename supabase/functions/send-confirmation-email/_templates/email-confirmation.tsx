
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "https://esm.sh/@react-email/components@0.0.22";
import * as React from "https://esm.sh/react@18.3.1";

interface EmailConfirmationTemplateProps {
  userName: string;
  confirmationUrl: string;
  token: string;
}

export const EmailConfirmationTemplate = ({
  userName,
  confirmationUrl,
  token,
}: EmailConfirmationTemplateProps) => (
  <Html>
    <Head />
    <Preview>🚀 Bem-vindo à Camply! Confirme sua conta em 1 clique</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header com gradiente e logo */}
        <Section style={header}>
          <Img
            src="https://ibwhqkgvrkkqxiksbiqr.supabase.co/storage/v1/object/public/assets/logo-camply.png"
            width="140"
            height="48"
            alt="Camply"
            style={logo}
          />
          <Text style={headerSubtitle}>Gestão Inteligente de Campanhas</Text>
        </Section>

        {/* Conteúdo Principal */}
        <Section style={content}>
          <div style={welcomeBadge}>
            <Text style={welcomeBadgeText}>🎉 Bem-vindo!</Text>
          </div>
          
          <Heading style={h1}>Olá, {userName}!</Heading>
          
          <Text style={subtitle}>
            Você está a <strong>um clique</strong> de revolucionar suas campanhas de marketing digital
          </Text>

          <Text style={text}>
            Criamos sua conta na <strong style={brandHighlight}>Camply</strong> com sucesso! 
            Agora você precisa confirmar seu email para começar a criar campanhas que realmente convertem.
          </Text>

          {/* Botão Principal com destaque */}
          <Section style={buttonContainer}>
            <Button style={primaryButton} href={confirmationUrl}>
              ✨ Confirmar Minha Conta
            </Button>
          </Section>

          <Text style={orText}>ou acesse este link diretamente:</Text>
          
          <div style={linkContainer}>
            <Link href={confirmationUrl} style={linkStyle}>
              {confirmationUrl}
            </Link>
          </div>

          <Hr style={divider} />

          {/* Código de verificação com design melhorado */}
          <Section style={codeSection}>
            <Text style={codeTitle}>📱 Código de verificação alternativo</Text>
            <div style={codeContainer}>
              <Text style={codeDisplay}>{token}</Text>
            </div>
            <Text style={codeHelper}>Cole este código se o link não funcionar</Text>
          </Section>

          <Hr style={divider} />

          {/* Benefícios com cards visuais */}
          <Section style={benefitsSection}>
            <Heading style={benefitsTitle}>🚀 O que você vai conseguir fazer:</Heading>
            
            <div style={benefitGrid}>
              <div style={benefitCard}>
                <Text style={benefitIcon}>📱</Text>
                <Text style={benefitText}>Campanhas para Meta Ads otimizadas por IA</Text>
              </div>
              
              <div style={benefitCard}>
                <Text style={benefitIcon}>💬</Text>
                <Text style={benefitText}>Leads qualificados direto no WhatsApp</Text>
              </div>
              
              <div style={benefitCard}>
                <Text style={benefitIcon}>🎯</Text>
                <Text style={benefitText}>Segmentação inteligente de audiência</Text>
              </div>
              
              <div style={benefitCard}>
                <Text style={benefitIcon}>📊</Text>
                <Text style={benefitText}>Análises em tempo real e insights</Text>
              </div>
            </div>
          </Section>

          {/* CTA secundário */}
          <Section style={secondaryCTA}>
            <Text style={ctaText}>⚡ Pronto para criar sua primeira campanha?</Text>
            <Button style={secondaryButton} href={confirmationUrl}>
              Vamos começar!
            </Button>
          </Section>
        </Section>

        {/* Footer melhorado */}
        <Section style={footer}>
          <Text style={footerSecurity}>
            🔒 Este link expira em 24 horas por segurança
          </Text>
          <Text style={footerHelp}>
            Não foi você? Pode ignorar este email com tranquilidade.
          </Text>
          
          <Hr style={footerDivider} />
          
          <Text style={footerBrand}>
            <strong>Camply</strong> - Transformando ideias em campanhas de sucesso
          </Text>
          
          <Text style={footerLinks}>
            <Link href="https://app.camply.com.br/legal/terms" style={footerLink}>
              Termos de Uso
            </Link>
            {" • "}
            <Link href="https://app.camply.com.br/legal/privacy" style={footerLink}>
              Privacidade
            </Link>
            {" • "}
            <Link href="mailto:suporte@camply.com.br" style={footerLink}>
              Suporte
            </Link>
          </Text>
          
          <Text style={footerCopyright}>
            © 2025 Camply. Todos os direitos reservados.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Estilos com as cores do Camply
const main = {
  backgroundColor: "#f8fafc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 25px rgba(79, 125, 249, 0.1)",
};

const header = {
  background: "linear-gradient(135deg, #4F7DF9 0%, #5EE7B2 100%)",
  padding: "40px 40px 30px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  filter: "brightness(0) invert(1)",
};

const headerSubtitle = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  margin: "8px 0 0",
  opacity: "0.9",
};

const content = {
  padding: "40px 40px 20px",
};

const welcomeBadge = {
  backgroundColor: "#FFF7ED",
  border: "2px solid #FFD66B",
  borderRadius: "25px",
  padding: "8px 20px",
  textAlign: "center" as const,
  marginBottom: "20px",
  display: "inline-block",
  width: "auto",
};

const welcomeBadgeText = {
  color: "#EA580C",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const h1 = {
  color: "#1e293b",
  fontSize: "32px",
  fontWeight: "700",
  lineHeight: "1.2",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const subtitle = {
  color: "#4F7DF9",
  fontSize: "18px",
  fontWeight: "500",
  lineHeight: "1.4",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const brandHighlight = {
  color: "#4F7DF9",
  fontWeight: "600",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  background: "linear-gradient(135deg, #4F7DF9 0%, #5EE7B2 100%)",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "18px 36px",
  boxShadow: "0 4px 12px rgba(79, 125, 249, 0.3)",
  border: "none",
};

const orText = {
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "20px 0 12px",
};

const linkContainer = {
  backgroundColor: "#f8fafc",
  padding: "12px",
  borderRadius: "8px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const linkStyle = {
  color: "#4F7DF9",
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const codeSection = {
  backgroundColor: "#f8fafc",
  border: "2px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const codeTitle = {
  color: "#475569",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const codeContainer = {
  backgroundColor: "#ffffff",
  border: "2px solid #4F7DF9",
  borderRadius: "8px",
  padding: "16px",
  margin: "0 0 12px",
};

const codeDisplay = {
  color: "#1e293b",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "3px",
  margin: "0",
  fontFamily: "Monaco, Consolas, monospace",
};

const codeHelper = {
  color: "#64748b",
  fontSize: "12px",
  margin: "0",
};

const benefitsSection = {
  backgroundColor: "#f0f9ff",
  border: "2px solid #bae6fd",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const benefitsTitle = {
  color: "#1e293b",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const benefitGrid = {
  display: "block",
};

const benefitCard = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "16px",
  margin: "0 0 12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
};

const benefitIcon = {
  fontSize: "20px",
  margin: "0 12px 0 0",
  minWidth: "24px",
};

const benefitText = {
  color: "#475569",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
  lineHeight: "1.4",
};

const secondaryCTA = {
  backgroundColor: "#5EE7B2",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "32px 0",
};

const ctaText = {
  color: "#064e3b",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const secondaryButton = {
  backgroundColor: "#064e3b",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  border: "none",
};

const footer = {
  padding: "30px 40px",
  backgroundColor: "#f8fafc",
};

const footerSecurity = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "500",
  textAlign: "center" as const,
  margin: "0 0 8px",
};

const footerHelp = {
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0 0 20px",
};

const footerDivider = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const footerBrand = {
  color: "#4F7DF9",
  fontSize: "16px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "0 0 12px",
};

const footerLinks = {
  color: "#64748b",
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "0 0 12px",
};

const footerLink = {
  color: "#4F7DF9",
  textDecoration: "none",
  fontWeight: "500",
};

const footerCopyright = {
  color: "#94a3b8",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0",
};

export default EmailConfirmationTemplate;
