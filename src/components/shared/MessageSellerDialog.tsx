
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

interface MessageSellerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sellerName: string;
}

export function MessageSellerDialog({ isOpen, onOpenChange, sellerName }: MessageSellerDialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") {
      toast({
        variant: "destructive",
        title: "Un mesaj goluț, ca un cufăr fără comoară?",
        description: `Te rugăm, scrie un mesaj pentru meșterul ${sellerName}.`,
      });
      return;
    }

    // Simulate sending message
    console.log(`Mesaj pentru ${sellerName}: ${message}`);
    toast({
      title: "Mesaj trimis cu zbor de pană!",
      description: `Mesajul tău fermecat pentru ${sellerName} a fost trimis prin vânt. (Simulare, desigur!)`,
    });
    setMessage("");
    onOpenChange(false); // Close dialog on successful "send"
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
