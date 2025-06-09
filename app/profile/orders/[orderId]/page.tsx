"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({ id: orderSnap.id, ...orderSnap.data() });
      } else {
        setOrder(null);
      }
      setLoading(false);
    }
    fetchOrder();
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
        </CardContent>
      </Card>
      <Button variant="outline" className="mt-6" onClick={() => router.back()}>Înapoi la comenzi</Button>
    </div>
  );
} 