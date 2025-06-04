
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { MessageSquareHeart, LifeBuoy } from 'lucide-react'; // Added LifeBuoy

export default function SupportPage() {
  return (
    <PlaceholderContent
      title="Sprijin Magic și Îndrumare în Tărâm"
      description="Ai o întrebare sau o nelămurire despre Tărâmul ioty? Spiridușii noștri ajutători sunt gata să te îndrume. Plănuim să aducem aici un portal de discuții live, plin de voie bună!"
      icon={LifeBuoy} // Changed icon
    />
  );
}
