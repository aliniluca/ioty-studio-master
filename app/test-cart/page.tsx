"use client";
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { addToCartFirestore, addToCartLocalStorage, getCartFromLocalStorage } from '@/lib/cart-utils';

export default function TestCartPage() {
  const { cartCount, cartItems, currentUserId, loading } = useCart();
  const [testResult, setTestResult] = useState<string>('');
  const [auth, setAuth] = useState<any>(null);

  useEffect(() => {
    setAuth(getAuth());
  }, []);

  const testCartWrite = async () => {
    if (!currentUserId) {
      setTestResult('No user ID available - testing localStorage');
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
        
        addToCartLocalStorage(testItem);
        setTestResult('Test item added to localStorage successfully!');
      } catch (error) {
        setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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

      const success = await addToCartFirestore(currentUserId, testItem);
      if (success) {
        setTestResult('Test item added to Firestore successfully!');
      } else {
        setTestResult('Test item added to localStorage (Firestore fallback)!');
      }
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCartRead = async () => {
    if (!currentUserId) {
      setTestResult('No user ID available - reading from localStorage');
      try {
        const localCart = getCartFromLocalStorage();
        setTestResult(`LocalStorage cart: ${JSON.stringify(localCart, null, 2)}`);
      } catch (error) {
        setTestResult(`Error reading localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
      setTestResult('No user ID available for security test');
      return;
    }

    try {
      // Test write permission
      const testItem = {
        id: 'security-test-' + Date.now(),
        name: 'Security Test',
        price: 1.00,
        quantity: 1,
        seller: 'Test',
        productId: 'test',
        dataAiHint: 'test'
      };

      await addToCartFirestore(currentUserId, testItem);
      setTestResult('Security test passed - write permission granted');
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setTestResult('Security test failed - permission denied. Rules may need to be deployed.');
      } else {
        setTestResult(`Security test error: ${error.message}`);
      }
    }
  };

  const clearTestData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
      setTestResult('Test data cleared from localStorage');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cart Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Current State:</h3>
              <p>User ID: {currentUserId || 'Not authenticated'}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
              <p>Cart Count: {cartCount}</p>
              <p>Cart Items: {cartItems.length}</p>
            </div>
            <div>
              <h3 className="font-semibold">Cart Items:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(cartItems, null, 2)}
              </pre>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={testCartWrite} className="w-full">
              Test Cart Write
            </Button>
            <Button onClick={testCartRead} className="w-full">
              Test Cart Read
            </Button>
            <Button onClick={testSecurityRules} className="w-full">
              Test Security Rules
            </Button>
            <Button onClick={clearTestData} variant="outline" className="w-full">
              Clear Test Data
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold">Test Result:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {testResult || 'No test run yet'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 