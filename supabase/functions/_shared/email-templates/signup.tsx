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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BRAND_NAME, BRAND_TAGLINE, LOGO_URL, styles } from './_styles.ts'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email para acessar o {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.wrapper}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={styles.logo} />
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Bem-vindo ao {BRAND_NAME}</Heading>
          <Text style={styles.text}>
            Obrigado por criar sua conta. Para começar a acompanhar o desempenho do seu site, confirme seu email clicando no botão abaixo.
          </Text>
          <Section style={styles.buttonWrapper}>
            <Button style={styles.button} href={confirmationUrl}>
              Confirmar email
            </Button>
          </Section>
          <Text style={styles.smallText}>
            Este link foi enviado para{' '}
            <Link href={`mailto:${recipient}`} style={styles.link}>
              {recipient}
            </Link>
            . Se você não criou essa conta, pode ignorar este email com segurança.
          </Text>
        </Section>
        <Section style={styles.footer}>
          <Text style={styles.footerBrand}>{BRAND_NAME}</Text>
          <Text style={{ margin: 0, fontSize: '12px', color: '#8B92A5' }}>
            {BRAND_TAGLINE} ·{' '}
            <Link href={siteUrl} style={{ color: '#5B6271' }}>
              kuboweb.com.br
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
