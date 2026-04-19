/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND_NAME, BRAND_TAGLINE, LOGO_URL, styles } from './_styles.ts'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={styles.main}>
      <Container style={styles.wrapper}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={styles.logo} />
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Confirme sua identidade</Heading>
          <Text style={styles.text}>
            Use o código abaixo para confirmar sua identidade:
          </Text>
          <Text style={styles.codeBox}>{token}</Text>
          <Text style={styles.smallText}>
            Este código expira em alguns minutos. Se você não solicitou essa verificação, pode ignorar este email.
          </Text>
        </Section>
        <Section style={styles.footer}>
          <Text style={styles.footerBrand}>{BRAND_NAME}</Text>
          <Text style={{ margin: 0, fontSize: '12px', color: '#8B92A5' }}>
            {BRAND_TAGLINE}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
