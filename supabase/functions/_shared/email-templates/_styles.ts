// Shared design tokens for all KUBOWEB auth emails
// Brand: navy/dark professional theme

export const LOGO_URL = 'https://mgiwqgmgipyysbgmhyrh.supabase.co/storage/v1/object/public/email-assets/logo-kuboweb.png'
export const BRAND_NAME = 'KUBOWEB'
export const BRAND_TAGLINE = 'Performance e leads pro seu site'

// Colors
const NAVY = '#0F1117'           // Primary dark (sidebar color from app)
const NAVY_HOVER = '#1A1D2A'
const TEXT_PRIMARY = '#0F1117'
const TEXT_SECONDARY = '#5B6271'
const TEXT_MUTED = '#8B92A5'
const BORDER = '#E5E7EB'
const BG_PAGE = '#F4F5F7'
const BG_CARD = '#FFFFFF'
const ACCENT_BG = '#F8F9FB'

export const styles = {
  main: {
    backgroundColor: BG_PAGE,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    margin: 0,
    padding: '40px 16px',
  },
  wrapper: {
    maxWidth: '560px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    padding: '0 0 28px',
  },
  logo: {
    height: '36px',
    width: 'auto',
    margin: '0 auto',
  },
  card: {
    backgroundColor: BG_CARD,
    borderRadius: '12px',
    border: `1px solid ${BORDER}`,
    padding: '40px 36px',
    boxShadow: '0 1px 3px rgba(15, 17, 23, 0.04)',
  },
  h1: {
    fontSize: '22px',
    fontWeight: '600' as const,
    color: TEXT_PRIMARY,
    margin: '0 0 16px',
    letterSpacing: '-0.01em',
    lineHeight: '1.3',
  },
  text: {
    fontSize: '15px',
    color: TEXT_SECONDARY,
    lineHeight: '1.65',
    margin: '0 0 18px',
  },
  button: {
    backgroundColor: NAVY,
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '600' as const,
    borderRadius: '8px',
    padding: '13px 28px',
    textDecoration: 'none',
    display: 'inline-block',
    margin: '12px 0 8px',
  },
  buttonWrapper: {
    margin: '8px 0 28px',
  },
  link: {
    color: NAVY,
    textDecoration: 'underline',
    fontWeight: '500' as const,
  },
  divider: {
    borderTop: `1px solid ${BORDER}`,
    margin: '28px 0 20px',
  },
  smallText: {
    fontSize: '13px',
    color: TEXT_MUTED,
    lineHeight: '1.55',
    margin: '0 0 8px',
  },
  footer: {
    textAlign: 'center' as const,
    padding: '24px 16px 0',
    fontSize: '12px',
    color: TEXT_MUTED,
    lineHeight: '1.5',
  },
  footerBrand: {
    fontWeight: '600' as const,
    color: TEXT_SECONDARY,
    fontSize: '13px',
    margin: '0 0 4px',
  },
  codeBox: {
    fontFamily: "'SF Mono', 'Menlo', 'Courier New', monospace",
    fontSize: '32px',
    fontWeight: '700' as const,
    color: NAVY,
    letterSpacing: '0.2em',
    textAlign: 'center' as const,
    margin: '8px 0 24px',
    padding: '20px 24px',
    backgroundColor: ACCENT_BG,
    borderRadius: '10px',
    border: `1px solid ${BORDER}`,
  },
}
