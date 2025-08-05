# Firestore Index Configuration Guide

## Issue: FirebaseError - The query requires an index

This error occurs when you have Firestore queries that combine multiple `where` clauses with `orderBy` clauses. Firestore requires composite indexes for such queries.

## Current Solution (Temporary)

I've temporarily fixed the issue by:
1. Removing `orderBy` clauses from queries with multiple `where` conditions
2. Implementing client-side sorting instead
3. This avoids the need for composite indexes immediately

## Files Modified

### 1. `app/shop/[shopId]/page.tsx`
**Before:**
```typescript
const productsQuery = query(
  collection(db, 'listings'),
  where('sellerId', '==', realShopId),
  where('status', '==', 'approved'),
  orderBy('dateAdded', 'desc'),
  limit(20)
);
```

**After:**
```typescript
const productsQuery = query(
  collection(db, 'listings'),
  where('sellerId', '==', realShopId),
  where('status', '==', 'approved'),
  limit(20)
);
// Sort client-side
productsData.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
```

### 2. `app/sell/orders/page.tsx`
**Before:**
```typescript
const q = query(
  collection(db, 'orders'),
  where('sellerId', '==', user.uid),
  orderBy('created', 'desc')
);
```

**After:**
```typescript
const q = query(
  collection(db, 'orders'),
  where('sellerId', '==', user.uid)
);
// Sort client-side
ordersData.sort((a, b) => {
  const dateA = a.created?.toDate ? a.created.toDate().getTime() : new Date(a.created).getTime();
  const dateB = b.created?.toDate ? b.created.toDate().getTime() : new Date(b.created).getTime();
  return dateB - dateA;
});
```

### 3. `app/profile/orders/page.tsx`
Similar changes applied for customer orders.

## Permanent Solution: Create Firestore Indexes

To restore server-side sorting and improve performance, create the following indexes in your Firebase Console:

### 1. Listings Collection Index
**Collection:** `listings`
**Fields:**
- `sellerId` (Ascending)
- `status` (Ascending) 
- `dateAdded` (Descending)

### 2. Orders Collection Index (Seller)
**Collection:** `orders`
**Fields:**
- `sellerId` (Ascending)
- `created` (Descending)

### 3. Orders Collection Index (Customer)
**Collection:** `orders`
**Fields:**
- `customer_email` (Ascending)
- `created` (Descending)

## How to Create Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Add the indexes listed above
6. Wait for indexes to build (can take several minutes)

## After Creating Indexes

Once the indexes are built, you can restore the original queries with `orderBy` clauses:

```typescript
// Restore this in app/shop/[shopId]/page.tsx
const productsQuery = query(
  collection(db, 'listings'),
  where('sellerId', '==', realShopId),
  where('status', '==', 'approved'),
  orderBy('dateAdded', 'desc'),
  limit(20)
);

// Restore this in app/sell/orders/page.tsx
const q = query(
  collection(db, 'orders'),
  where('sellerId', '==', user.uid),
  orderBy('created', 'desc')
);

// Restore this in app/profile/orders/page.tsx
const q = query(
  collection(db, 'orders'),
  where('customer_email', '==', user.email),
  orderBy('created', 'desc')
);
```

## Benefits of Server-Side Sorting

- **Better Performance**: Less data transferred to client
- **Consistent Ordering**: Guaranteed order regardless of client
- **Reduced Client Load**: No need for client-side sorting
- **Pagination Support**: Works better with `limit()` and `startAfter()`

## Monitoring Index Status

You can monitor index build status in the Firebase Console:
- **Firestore Database** → **Indexes** tab
- Green checkmark = Index ready
- Yellow clock = Index building
- Red X = Index failed

## Best Practices

1. **Plan Indexes Early**: Design your queries with indexes in mind
2. **Use Composite Indexes**: For queries with multiple `where` + `orderBy`
3. **Monitor Usage**: Check which indexes are actually used
4. **Optimize Queries**: Avoid unnecessary `where` clauses
5. **Consider Pagination**: Use `limit()` and `startAfter()` for large datasets 