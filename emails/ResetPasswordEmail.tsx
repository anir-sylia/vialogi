"use client";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  locale: "fr" | "ar";
  resetUrl: string;
};

const BRAND = "#0d9488";

export default function ResetPasswordEmail({ locale, resetUrl }: Props) {
  const isAr = locale === "ar";

  const subject = isAr
    ? "استرجاع كلمة السر - فيالوجي"
    : "Réinitialisation de votre mot de passe - ViaLogi";

  const body = isAr
    ? "سلام، توصلنا بطلب باش تبدل كلمة السر ديالك في ViaLogi. اضغط على الزر لتحت باش تختار كلمة سر جديدة. هاد الرابط صالح لمدة ساعة واحدة فقط."
    : "Bonjour, vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien expire dans 1 heure.";

  const cta = isAr ? "تبديل كلمة السر" : "Changer mon mot de passe";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <Html dir={dir} lang={locale}>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoWrap}>
            <Text style={styles.logo}>ViaLogi</Text>
          </Section>

          <Section style={styles.card}>
            <Heading as="h1" style={styles.h1}>
              {subject}
            </Heading>
            <Text style={styles.p}>{body}</Text>

            <Section style={styles.ctaRow}>
              <Button href={resetUrl} style={styles.button}>
                {cta}
              </Button>
            </Section>

            <Text style={styles.small}>
              {isAr
                ? "إلى ماطلبتيش هاد التغيير، تقدر تتجاهل هاد الرسالة."
                : "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail."}
            </Text>
          </Section>

          <Text style={styles.footer}>
            © {new Date().getFullYear()} ViaLogi
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: "32px 12px",
    backgroundColor: "#f8fafc",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Noto Sans', 'Noto Sans Arabic', sans-serif",
    color: "#0f172a",
  },
  container: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
  },
  logoWrap: {
    textAlign: "center",
    marginBottom: 14,
  },
  logo: {
    display: "inline-block",
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: BRAND,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    border: "1px solid rgba(226,232,240,0.9)",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
    padding: "26px 22px",
  },
  h1: {
    margin: 0,
    fontSize: 22,
    lineHeight: "28px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    textAlign: "center",
  },
  p: {
    margin: "14px 0 0",
    fontSize: 14,
    lineHeight: "22px",
    color: "#334155",
    textAlign: "center",
  },
  ctaRow: {
    textAlign: "center",
    marginTop: 18,
    marginBottom: 6,
  },
  button: {
    backgroundColor: BRAND,
    color: "#ffffff",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 18px",
    textDecoration: "none",
    display: "inline-block",
  },
  small: {
    margin: "14px 0 0",
    fontSize: 12,
    lineHeight: "18px",
    color: "#64748b",
    textAlign: "center",
  },
  footer: {
    margin: "14px 0 0",
    fontSize: 12,
    lineHeight: "18px",
    color: "#94a3b8",
    textAlign: "center",
  },
};

