// src/app/policies/privacy/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { ScrollText } from 'lucide-react'; // Using ScrollText for policy documents
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <PlaceholderContent
      title="Secretul datelor fermecate"
      description="Aici vei găsi în curând pergamentul magic ce descrie cum păstrăm secretele datelor tale personale în Tărâmul ioty. Meșterim la el cu grijă și respect pentru intimitatea ta."
      icon={ScrollText}
    >
      <Button asChild className="mt-6">
        <Link href="/">Înapoi la Târgul Fermecat</Link>
      </Button>
    </PlaceholderContent>
  );
}
