// src/app/policies/terms-of-service/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { ScrollText } from 'lucide-react'; // Using ScrollText for policy documents
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
  return (
    <PlaceholderContent
      title="Legile magice ale tărâmului"
      description="În curând, aici va fi expus sulul cu legile și rânduielile Tărâmului ioty, pentru o bună înțelegere între toți meșterii și călătorii. Cronicarii noștri le scriu cu sârg și înțelepciune."
      icon={ScrollText}
    >
      <Button asChild className="mt-6">
        <Link href="/">Înapoi la Târgul Fermecat</Link>
      </Button>
    </PlaceholderContent>
  );
}
