/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso para {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.wrapper}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={styles.logo} />
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Seu link de acesso</Heading>
          <Text style={styles.text}>
            Clique no botão abaixo para entrar no {BRAND_NAME}. Este link expira em alguns minutos.
          </Text>
          <Section style={styles.buttonWrapper}>
            <Button style={styles.button} href={confirmationUrl}>
              Entrar
            </Button>
          </Section>
          <Text style={styles.smallText}>
            Se você não solicitou este link, pode ignorar este email com segurança.
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

export default MagicLinkEmail
