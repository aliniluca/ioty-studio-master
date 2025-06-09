// src/app/account/messages/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Mail } from 'lucide-react'; // Removed MessageSquareHeart as Mail is more direct
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SellerMessagesPage() {
  return (
    <PlaceholderContent
      title="Cutia cu vorbe de la călători"
      description="Aici vei găsi toate mesajele, întrebările și poveștile trimise de călătorii curioși din Tărâmul ioty. Spiridușii noștri încă meșteresc la această cutie poștală magică!"
      icon={Mail}
    >
        <Button asChild className="mt-6">
            <Link href="/account">Înapoi la panoul de bord</Link>
        </Button>
    </PlaceholderContent>
  );
}
