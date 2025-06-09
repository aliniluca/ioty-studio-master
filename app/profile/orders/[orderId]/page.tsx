"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderAndReview() {
      if (!orderId) return;
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = { id: orderSnap.id, ...orderSnap.data() };
        setOrder(orderData);
        if (orderData.shopId) {
          setShopId(orderData.shopId);
          const user = typeof window !== 'undefined' ? window.localStorage.getItem('userEmail') : null;
          const reviewsQuery = query(collection(db, 'shops', orderData.shopId, 'reviews'), where('orderId', '==', orderId));
          const reviewsSnap = await getDocs(reviewsQuery);
          if (!reviewsSnap.empty) {
            setExistingReview(reviewsSnap.docs[0].data());
          }
        }
      } else {
        setOrder(null);
      }
      setLoading(false);
    }
    fetchOrderAndReview();
  }, [orderId]);

  const handleDownloadPDF = () => {
    if (!order) return;
    const docPdf = new jsPDF();
    docPdf.text(`Chitanță comandă #${order.id.slice(-6).toUpperCase()}`, 10, 10);
    docPdf.text(`Data: ${order.created?.toDate ? order.created.toDate().toLocaleString() : new Date(order.created).toLocaleString()}`, 10, 20);
    docPdf.text(`Email client: ${order.customer_email}`, 10, 30);
    docPdf.text(`Sumă: ${(order.amount_total / 100).toFixed(2)} ${order.currency?.toUpperCase() || 'RON'}`, 10, 40);
    docPdf.text(`Status: ${order.payment_status}`, 10, 50);
    docPdf.save(`chitanta_comanda_${order.id.slice(-6).toUpperCase()}.pdf`);
  };

  const handleSubmitReview = async () => {
    if (!shopId || !order) return;
    setSubmitting(true);
    try {
      const reviewId = uuidv4();
      await setDoc(doc(db, 'shops', shopId, 'reviews', reviewId), {
        id: reviewId,
        orderId: order.id,
        rating,
        comment: review,
        createdAt: new Date().toISOString(),
        userEmail: order.customer_email,
      });
      setExistingReview({ rating, comment: review });
      setReview('');
      setRating(0);
    } catch (e) {}
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  if (!order) {
    return <div className="text-center py-10">Comanda nu a fost găsită.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Detalii comandă #{order.id.slice(-6).toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-muted-foreground text-sm">Plasată pe: {order.created?.toDate ? order.created.toDate().toLocaleString() : new Date(order.created).toLocaleString()}</div>
          <div className="mb-2 text-muted-foreground text-sm">Email client: {order.customer_email}</div>
          <div className="mb-2 text-lg font-bold">Sumă: {(order.amount_total / 100).toFixed(2)} {order.currency?.toUpperCase() || 'RON'}</div>
          <div className="mb-2 text-sm">Status: <span className="font-semibold">{order.payment_status}</span></div>
          <Button onClick={handleDownloadPDF} className="mt-4">Descarcă chitanța PDF</Button>
          {shopId && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-2">Recenzie pentru atelier</h2>
              {existingReview ? (
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`h-5 w-5 ${i <= existingReview.rating ? 'text-yellow-500' : 'text-muted-foreground'}`} />)}
                  </div>
                  <div className="text-muted-foreground">{existingReview.comment}</div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button" onClick={() => setRating(i)} aria-label={`Alege rating ${i} stele`}>
                        <Star className={`h-6 w-6 ${i <= rating ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Scrie o recenzie pentru atelier..." rows={3} />
                  <Button onClick={handleSubmitReview} disabled={submitting || !review || !rating} className="mt-2">Trimite recenzia</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Button variant="outline" className="mt-6" onClick={() => router.back()}>Înapoi la comenzi</Button>
    </div>
  );
} 