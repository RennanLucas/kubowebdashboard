/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirme sua identidade</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código expira em poucos minutos. Se você não solicitou essa verificação, pode ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: 'hsl(224, 20%, 14%)',
  margin: '0 0 20px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 10%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: "'SF Mono', 'Courier New', monospace",
  fontSize: '32px',
  fontWeight: '700' as const,
  color: 'hsl(239, 84%, 67%)',
  letterSpacing: '0.15em',
  margin: '0 0 30px',
  padding: '16px 24px',
  backgroundColor: 'hsl(220, 14%, 95.5%)',
  borderRadius: '12px',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 60%)', margin: '32px 0 0', lineHeight: '1.5' }
