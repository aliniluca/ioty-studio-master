// src/app/account/edit-profile/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { UserCog } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditProfilePage() {
  // In a real app, this page would have a form to edit user details like name, email, password.
  // For now, it's a placeholder.
  return (
    <PlaceholderContent
      title="Șlefuiește-ți chipul din tărâm"
      description="Aici vei putea în curând să-ți actualizezi numele de meșter, adresa de email sau formula magică (parola). Spiridușii încă lucrează la uneltele potrivite!"
      icon={UserCog}
    >
        <Button asChild className="mt-6">
            <Link href="/account">Înapoi la panoul de bord</Link>
        </Button>
    </PlaceholderContent>
  );
}
