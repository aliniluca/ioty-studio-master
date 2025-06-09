// src/components/shared/MessageSellerDialog.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Feather } from 'lucide-react';
import { setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/firebase/firebaseConfig';

interface MessageSellerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sellerName: string;
  sellerId: string;
}

export function MessageSellerDialog({ isOpen, onOpenChange, sellerName, sellerId }: MessageSellerDialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") {
      toast({
        variant: "destructive",
        title: "Un mesaj goluț, ca un cufăr fără comoară?",
        description: `Te rugăm, scrie un mesaj pentru meșterul ${sellerName}.`,
      });
      return;
    }
    try {
      if (!auth.currentUser) throw new Error('Trebuie să fii autentificat pentru a trimite mesaje.');
      const sender = auth.currentUser;
      const msgId = uuidv4();
      const notifId = uuidv4();
      // Save message to seller's messages
      await setDoc(doc(db, 'users', sellerId, 'messages', msgId), {
        id: msgId,
        senderName: sender.displayName || sender.email || 'Călător necunoscut',
        senderId: sender.uid,
        subject: `Mesaj de la ${sender.displayName || sender.email}`,
        body: message,
        createdAt: new Date().toISOString(),
        read: false,
      });
      // Create notification for seller
      await setDoc(doc(db, 'users', sellerId, 'notifications', notifId), {
        id: notifId,
        type: 'message',
        title: 'Ai primit un mesaj nou!',
        body: `Ai primit un mesaj de la ${sender.displayName || sender.email}.`,
        createdAt: new Date().toISOString(),
        read: false,
        senderId: sender.uid,
      });
      toast({
        title: "Mesaj trimis cu succes!",
        description: `Mesajul tău pentru ${sellerName} a fost trimis.",
      });
      setMessage("");
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Eroare la trimiterea mesajului",
        description: err.message || 'A apărut o problemă. Încearcă din nou!',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center"><Feather className="mr-2 h-5 w-5 text-primary" />Trimite o vorbă bună lui {sellerName}</DialogTitle>
          <DialogDescription>
            Ai o întrebare despre o făuritură sau vrei să personalizezi o comandă? Lasă aici gândurile tale.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="message" className="text-left">
                Mesajul tău fermecat
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Scrie aici întrebarea sau dorința ta pentru meșterul ${sellerName}...`}
                className="col-span-3"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Anulează descântecul</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="mr-2 h-4 w-4" /> Trimite mesajul cu zbor de pană
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
