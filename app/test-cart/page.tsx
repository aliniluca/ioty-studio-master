"use client";
import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

export default function TestCartPage() {
  const { cartCount, cartItems, currentUserId, loading } = useCart();
  const [testResult, setTestResult] = useState<string>('');

  const testCartWrite = async () => {
    if (!currentUserId) {
      setTestResult('No user ID available');
      return;
    }

    try {
      const testItem = {
        id: 'test-item-' + Date.now(),
        name: 'Test Product',
        price: 10.99,
        imageUrl: 'https://picsum.photos/200',
        quantity: 1,
        seller: 'Test Seller',
        productId: 'test-product',
        dataAiHint: 'test'
      };

      const cartRef = doc(db, 'cart', currentUserId);
      await setDoc(cartRef, {
        [testItem.id]: testItem,
        lastUpdated: new Date()
      });

      setTestResult('Test item added successfully!');
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCartRead = async () => {
    if (!currentUserId) {
      setTestResult('No user ID available');
      return;
    }

    try {
      const cartRef = doc(db, 'cart', currentUserId);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        setTestResult(`Cart exists with data: ${JSON.stringify(cartData, null, 2)}`);
      } else {
        setTestResult('Cart document does not exist');
      }
    } catch (error) {
      setTestResult(`Error reading cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSecurityRules = async () => {
    if (!currentUserId) {
      setTestResult('No user ID available');
      return;
    }

    try {
      // Test 1: Try to write to cart collection
      const cartRef = doc(db, 'cart', currentUserId);
      await setDoc(cartRef, { 
        test: true, 
        timestamp: new Date(),
        userId: currentUserId 
      });
      
      // Test 2: Try to read it back
      const cartSnap = await getDoc(cartRef);
      if (cartSnap.exists()) {
        setTestResult('Security rules test PASSED - Can write and read from carts collection');
      } else {
        setTestResult('Security rules test FAILED - Document was not written');
      }
    } catch (error) {
      setTestResult(`Security rules test FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Cart Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Cart Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>User ID:</strong> {currentUserId || 'Not authenticated'}</p>
          <p><strong>Cart Count:</strong> {cartCount}</p>
          <p><strong>Cart Items:</strong> {cartItems.length}</p>
          <div>
            <strong>Cart Items Details:</strong>
            <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-auto">
              {JSON.stringify(cartItems, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testCartWrite}>Test Cart Write</Button>
          <Button onClick={testCartRead}>Test Cart Read</Button>
          <Button onClick={testSecurityRules}>Test Security Rules</Button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-muted rounded">
              <strong>Test Result:</strong>
              <pre className="mt-2 text-sm overflow-auto">{testResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 