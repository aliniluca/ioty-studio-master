// src/app/account/edit-shop/page.tsx
"use client";

import { EditShopForm } from '@/components/account/EditShopForm';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditShopPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-card shadow-xl">
        <CardHeader className="text-center">
          <Edit3 className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold text-card-foreground">Șlefuiește detaliile atelierului tău</CardTitle>
          <CardDescription className="text-muted-foreground">
            Actualizează povestea, chipul și locația atelierului tău pentru ca toți călătorii din tărâm să te găsească mai ușor.
          </CardDescription>
        </CardHeader>
        <EditShopForm /> 
      </Card>
    </div>
  );
}
