"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { getIdTokenResult } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminReportsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<any | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const tokenResult = await getIdTokenResult(user, true);
        setIsAdmin(!!tokenResult.claims.admin);
        if (!!tokenResult.claims.admin) {
          // Fetch reports from Firestore
          const reportsSnap = await getDocs(collection(db, 'reports'));
          setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } else {
        setIsAdmin(false);
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleResolve = async (reportId: string) => {
    setUpdating(reportId);
    await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
    setReports(reports => reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    setUpdating(null);
  };

  const handleEscalate = async (reportId: string) => {
    setUpdating(reportId);
    await updateDoc(doc(db, 'reports', reportId), { status: 'escalated' });
    setReports(reports => reports.map(r => r.id === reportId ? { ...r, status: 'escalated' } : r));
    setUpdating(null);
  };

  const handleViewContent = async (report: any) => {
    setContentLoading(true);
    let content = null;
    if (report.type === 'listing') {
      const listingDoc = await getDoc(doc(db, 'listings', report.targetId));
      if (listingDoc.exists()) {
        content = listingDoc.data();
      }
    } else if (report.type === 'shop') {
      const shopDoc = await getDoc(doc(db, 'shops', report.targetId));
      if (shopDoc.exists()) {
        content = shopDoc.data();
      }
    }
    setViewingContent({ type: report.type, ...content });
    setContentLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">Se încarcă rapoartele...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center py-10">Nu ai acces la această zonă.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Rapoarte &amp; Moderare</h1>
      <Card>
        <CardHeader><CardTitle>Rapoarte</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Tip</th>
                <th className="py-2">Țintă</th>
                <th className="py-2">Raportat de</th>
                <th className="py-2">Status</th>
                <th className="py-2">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id} className={report.status === 'resolved' ? 'opacity-50' : ''}>
                  <td className="py-2">{report.type}</td>
                  <td className="py-2">{report.targetId}</td>
                  <td className="py-2">{report.reporterEmail}</td>
                  <td className="py-2">{report.status}</td>
                  <td className="py-2 flex gap-2">
                    {report.status !== 'resolved' && (
                      <Button size="sm" variant="secondary" disabled={updating === report.id} onClick={() => handleResolve(report.id)}>
                        Marchează ca rezolvat
                      </Button>
                    )}
                    {report.status !== 'escalated' && (
                      <Button size="sm" variant="destructive" disabled={updating === report.id} onClick={() => handleEscalate(report.id)}>
                        Escaladează
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleViewContent(report)} disabled={contentLoading}>
                      Vezi conținutul
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {/* Modal for viewing reported content */}
      <Dialog open={!!viewingContent} onOpenChange={v => { if (!v) setViewingContent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conținut raportat</DialogTitle>
          </DialogHeader>
          {viewingContent && (
            <div>
              {viewingContent.type === 'listing' ? (
                <>
                  <div className="font-bold mb-2">{viewingContent.name}</div>
                  <div className="text-muted-foreground mb-2">{viewingContent.description}</div>
                </>
              ) : viewingContent.type === 'shop' ? (
                <>
                  <div className="font-bold mb-2">{viewingContent.name}</div>
                  <div className="text-muted-foreground mb-2">{viewingContent.tagline}</div>
                </>
              ) : (
                <div>Nu există detalii pentru acest tip de raport.</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 