// src/app/admin/moderate-listings/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, XCircle, ShieldQuestion, Wand } from 'lucide-react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const statusTranslations: Record<ListingStatus, string> = {
  approved: "Aprobată",
  pending_approval: "Așteaptă aprobarea",
  rejected: "Respinsă",
  draft: "Ciornă"
};

export default function ModerateListingsPage() {
  const { toast } = useToast();
  const [pendingListings, setPendingListings] = useState<ProductDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectListingId, setRejectListingId] = useState<string | null>(null);

  const fetchPendingListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'listings'), where('status', '==', 'pending_approval'));
      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => doc.data());
      setPendingListings(listings);
    } catch (error) {
      setPendingListings([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPendingListings();
  }, [fetchPendingListings]);

  const handleUpdateStatus = async (listingId: string, newStatus: ListingStatus, listingName: string, reason?: string) => {
    try {
      const listingRef = doc(db, 'listings', listingId);
      if (newStatus === 'approved') {
        await updateDoc(listingRef, { status: 'approved', rejectionReason: null });
        toast({
          title: "Stare actualizată!",
          description: `Minunăția \"${listingName}\" a fost marcată ca aprobată.`,
        });
        // --- Notification logic ---
        const notifId = uuidv4();
        await setDoc(doc(db, 'users', pendingListings.find(l => l.id === listingId)?.seller.id, 'notifications', notifId), {
          id: notifId,
          type: 'listing',
          title: 'Minunăția ta a fost aprobată!',
          body: `Anunțul "${listingName}" a fost aprobat și este acum vizibil în târg!`,
          createdAt: new Date().toISOString(),
          read: false,
          listingId: listingId,
        });
        // --- End notification logic ---
      } else if (newStatus === 'rejected') {
        await updateDoc(listingRef, { status: 'rejected', rejectionReason: reason || '' });
        toast({
          title: "Stare actualizată!",
          description: `Minunăția \"${listingName}\" a fost respinsă.`,
        });
        // --- Notification logic ---
        const notifId = uuidv4();
        await setDoc(doc(db, 'users', pendingListings.find(l => l.id === listingId)?.seller.id, 'notifications', notifId), {
          id: notifId,
          type: 'listing',
          title: 'Minunăția ta a fost respinsă',
          body: `Anunțul "${listingName}" a fost respins de moderatori. Editează detaliile și retrimite-l spre aprobare.`,
          createdAt: new Date().toISOString(),
          read: false,
          listingId: listingId,
        });
        // --- End notification logic ---
      }
      fetchPendingListings();
    } catch (error) {
      toast({ title: "Eroare!", description: "Nu s-a putut actualiza starea minunăției." });
    }
  };

  const openRejectModal = (listingId: string) => {
    setRejectListingId(listingId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectListingId(null);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (rejectListingId) {
      const listing = pendingListings.find(l => l.id === rejectListingId);
      handleUpdateStatus(rejectListingId, 'rejected', listing?.name || '', rejectReason);
    }
    closeRejectModal();
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
            <p className="text-muted-foreground">Se caută minunățiile ce așteaptă binecuvântarea zânelor...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground flex items-center">
            <ShieldQuestion className="mr-3 h-8 w-8 text-primary" />
            Panoul Zânelor: Aprobă Minunățiile
          </CardTitle>
          <CardDescription>
            Aici poți vedea toate făuriturile care așteaptă o vorbă bună (aprobare) sau o îndrumare (respingere) de la zânele tărâmului.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingListings.length === 0 ? (
            <PlaceholderContent
              icon={Wand}
              title="Nicio minunăție nu așteaptă la poartă!"
              description="Toate făuriturile din târg au primit deja o vorbă de la zâne. Atelierul de moderare este momentan liniștit."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] hidden sm:table-cell">Chip</TableHead>
                  <TableHead>Numele Minunăției</TableHead>
                  <TableHead>Meșter Faur</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Valoare</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Adăugată la</TableHead>
                  <TableHead className="text-center">Stare Curentă</TableHead>
                  <TableHead className="text-right w-[180px]">Unelte Magice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="hidden sm:table-cell">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={listing.images[0]?.url || `https://picsum.photos/seed/${listing.id}/60/60`}
                          alt={listing.name}
                          layout="fill"
                          objectFit="cover"
                          data-ai-hint={listing.dataAiHint || 'imagine produs'}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/products/${listing.id}`} className="text-card-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
                        {listing.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/shop/${listing.seller.id}`} className="text-sm text-muted-foreground hover:underline">
                        {listing.seller.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">{listing.price.toFixed(2)} RON</TableCell>
                    <TableCell className="text-center hidden lg:table-cell text-xs">
                      {format(new Date(listing.dateAdded), 'd MMM yyyy, HH:mm', { locale: ro })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {statusTranslations[listing.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                        onClick={() => handleUpdateStatus(listing.id, 'approved', listing.name)}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Aprobă
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                        onClick={() => openRejectModal(listing.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Respinge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-2">Motivul respingerii</h2>
            <textarea
              className="w-full border rounded p-2 mb-4 text-black dark:text-white"
              rows={4}
              placeholder="Explică de ce respingi această minunăție..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeRejectModal}>Anulează</Button>
              <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim()}>Respinge</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
