import type { ReactNode } from "react";

/** The public site's legal pages. */
const TERMS_URL = "https://www.thecritpath.com/terms";
const PRIVACY_URL = "https://www.thecritpath.com/privacy";

function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      className="underline underline-offset-2 transition-colors hover:text-foreground"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export const TermsLink = () => <LegalLink href={TERMS_URL}>Terms of Service</LegalLink>;
export const PrivacyLink = () => <LegalLink href={PRIVACY_URL}>Privacy Policy</LegalLink>;

/**
 * "By continuing, you agree…" under the sign-up and sign-in forms: Continue with Google makes an
 * account from either page, so both say it.
 */
export function AgreeToTerms() {
  return (
    <p className="text-center text-2xs/relaxed text-muted-foreground">
      By continuing, you agree to CritPath’s <TermsLink /> and <PrivacyLink />.
    </p>
  );
}
