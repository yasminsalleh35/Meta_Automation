import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface PasswordRecoveryEmailProps {
  confirmationUrl: string;
}

export const PasswordRecoveryEmail = ({
  confirmationUrl,
}: PasswordRecoveryEmailProps) => (
  <Html>
    <Head />
    <Preview>Recuperar senha da sua conta Camply</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Recuperar Senha</Heading>
        <Text style={text}>
          Você solicitou a recuperação da senha da sua conta na Camply.
        </Text>
        <Text style={text}>
          <strong>Importante:</strong> Ao clicar no link abaixo, você precisará obrigatoriamente 
          definir uma nova senha antes de acessar sua conta.
        </Text>
        <Link
          href={confirmationUrl}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            textAlign: 'center' as const,
          }}
        >
          Definir Nova Senha
        </Link>
        <Text style={smallText}>
          Este link expira em 1 hora por segurança.
        </Text>
        <Text style={smallText}>
          Se você não solicitou esta recuperação, pode ignorar este e-mail com segurança.
        </Text>
        <Text style={footer}>
          Camply - Sua plataforma de campanhas digitais
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
};

const link = {
  color: '#2563eb',
  fontSize: '16px',
  textDecoration: 'underline',
};

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
};