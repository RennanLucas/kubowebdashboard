/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email para acessar o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao KUBOWEB! 🎉</Heading>
        <Text style={text}>
          Obrigado por criar sua conta no{' '}
          <Link href={siteUrl} style={link}>
            <strong>KUBOWEB</strong>
          </Link>
          . Você está a um clique de começar a acompanhar o desempenho do seu site em tempo real.
        </Text>
        <Text style={text}>
          Confirme seu email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar Email
        </Button>
        <Text style={footer}>
          Se você não criou essa conta, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'hsl(239, 84%, 67%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(239, 84%, 67%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '500' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 24px',
}
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 60%)', margin: '32px 0 0', lineHeight: '1.5' }
