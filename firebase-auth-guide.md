# Firebase Authentication Guide for Next.js

This guide provides a comprehensive overview of how to implement Firebase authentication in a Next.js application, protect routes, and manage user data in a database.

## 1. Setting Up Firebase Authentication

We've already set up the basic Firebase configuration. Here's a recap of the files involved:

*   `lib/firebase.ts`: Initializes Firebase and exports the `auth` object.
*   `lib/auth.ts`: Contains functions for signing in with Google and signing out.
*   `app/components/login.tsx`: The UI component for handling the login and logout functionality.

### Key Concepts:

*   **`onAuthStateChanged`:** This is a listener from the Firebase Auth SDK that tracks the user's authentication state. It's the recommended way to get the current user.
*   **`signInWithPopup`:** This function initiates the Google Sign-In flow.
*   **`signOut`:** This function signs the user out.

## 2. Protecting Routes

To protect certain routes in your Next.js application, you can create a Higher-Order Component (HOC) that checks for an authenticated user before rendering the requested page.

### Example: `withAuth` HOC

Create a new file `app/components/withAuth.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  const Wrapper = (props: any) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.push("/");
        } else {
          setUser(user);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, [router]);

    if (loading) {
      return <div>Loading...</div>; // Or a loading spinner
    }

    if (!user) {
      return null; // Or a redirect component
    }

    return <WrappedComponent {...props} user={user} />;
  };

  return Wrapper;
};

export default withAuth;
```

### How to use the `withAuth` HOC:

Now, you can protect any page by wrapping it with the `withAuth` HOC. For example, to protect a `dashboard` page:

`app/dashboard/page.tsx`:

```tsx
"use client";

import withAuth from "@/app/components/withAuth";

const DashboardPage = ({ user }) => {
  return (
    <div>
      <h1>Welcome to your Dashboard, {user.displayName}!</h1>
      <p>Your user ID is: {user.uid}</p>
    </div>
  );
};

export default withAuth(DashboardPage);
```

## 3. Passing User ID to a Database (Firestore Example)

When a user signs up or logs in, you'll often want to store their information in a database like Firestore. The user's UID (unique ID) from Firebase Authentication is the perfect primary key for your user documents.

### Setting up Firestore

First, you'll need to enable Firestore in your Firebase project and update your `lib/firebase.ts` file to include it.

1.  Go to the [Firebase console](https://console.firebase.google.com/).
2.  Select your project.
3.  Click on "Firestore Database" in the left-hand menu.
4.  Click "Create database" and follow the setup instructions.

Now, update `lib/firebase.ts`:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // ... your config
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Storing User Data

You can create a function to save user data to Firestore whenever a new user signs up.

In `lib/auth.ts`, you can modify the `signInWithGoogle` function to check if the user is new and create a new document in Firestore:

```typescript
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user is new
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // User is new, create a new document
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
}

// ... signOutFromGoogle function
```

### Firestore Security Rules

To ensure that users can only read and write their own data, you should set up Firestore security rules.

In your Firebase console, go to **Firestore Database > Rules**. Here's an example of rules that allow users to read and write only their own documents in the `users` collection:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

This is a basic example, but it demonstrates the fundamental principle of securing your data using Firebase Authentication and Firestore rules.
This is an excellent foundation. The guide effectively covers client-side Firebase Auth implementation, route protection using a Client Component HOC (`withAuth`), and basic Firestore integration with security rules.

However, a **professional and secure** Next.js application (especially with the App Router) requires handling authentication on the **server-side** to use **Next.js Server Actions** and fully leverage the platform's security benefits.

The current `withAuth` HOC has a major security/UX drawback: it relies purely on client-side checks and will flicker or render the unauthorized page momentarily before redirecting.

Here is the **proper professional guide extension** focusing on **Server-Side Security, Next.js Server Actions, and using Firebase Admin SDK.**

-----

## 4\. 🔒 Professional Security: Server-Side Authentication

The client-side `onAuthStateChanged` is great for UI updates, but for **critical data fetching, route protection, and Server Actions**, you must verify the user's identity on the server. This prevents users from bypassing client-side checks and accessing data directly.

### Key Concepts for Server-Side Auth

  * **ID Token:** When a user logs in, Firebase Auth sends a short-lived **ID Token** in the response. This token is proof of the user's identity.
  * **Firebase Admin SDK:** This SDK is used **only on the server** (API Routes, Server Actions) to securely verify the ID Token.
  * **Cookies:** Since Server Actions are stateless, you must store the ID Token in a secure HTTP-only cookie, making it available for subsequent Server Actions.

### 4.1. Server-Side Setup

#### 🛠️ Step A: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

#### 🛠️ Step B: Initialize Firebase Admin

Create a server-only file, e.g., `lib/firebase-admin.ts`. This file should only run on the server.

```typescript
// lib/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Use a service account private key for production, or a simpler method for dev
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    // Optional: databaseURL, storageBucket, etc.
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
```

> **Security Note:** In production, set the `FIREBASE_SERVICE_ACCOUNT` environment variable to the JSON content of your service account key file (downloaded from Firebase Console \> Project Settings \> Service Accounts). **NEVER commit this file to your repository.**

-----

## 5\. 🔄 Bridging Client & Server with Cookies

Since Server Actions don't automatically receive the Firebase ID Token, we must explicitly send it to the server and store it in a cookie.

### 5.1. Creating a Session Cookie (Client Component)

After a successful login, we get the ID Token and send it to a custom **API Route** (or a special Server Action) to mint a secure cookie.

Create a function to refresh the token and send it to a server action:

```typescript
// lib/auth.ts (New Function)
import { auth } from "./firebase";

// This function is run client-side after login or on a timer
export async function createSessionCookie() {
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken(true); // true forces token refresh
    
    // Call a Server Action to set the secure cookie
    await setTokenCookieAction(idToken);
  }
}
```

### 5.2. Server Action to Set the Cookie

This server action receives the token and sets a secure cookie.

```typescript
// app/actions/auth-actions.ts
"use server";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export async function setTokenCookieAction(idToken: string) {
  try {
    // Session cookies are more robust than ID Tokens for Server Actions
    // Set expiry to 5 days (adjust as needed)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; 
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    cookies().set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true, // IMPORTANT: Prevents XSS attacks
      secure: process.env.NODE_ENV === "production", // Only over HTTPS in production
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Error setting session cookie:", error);
    return { success: false, error: "Failed to set session." };
  }
}
```

-----

## 6\. 🔐 Securing Server Actions

Now, any Server Action can retrieve the session cookie, verify it, and access the authenticated user's `uid` to secure database operations.

### 6.1. The Auth Checker Function

Create a utility function to handle the token verification.

```typescript
// lib/server-utils.ts
import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

// Decodes the session cookie and returns the user's UID or throws an error
export async function getAuthenticatedUserUid(): Promise<string> {
  const sessionCookie = cookies().get("session")?.value;

  if (!sessionCookie) {
    throw new Error("Authentication required.");
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    // Clear cookie on verification failure (token expired, etc.)
    cookies().delete("session");
    throw new Error("Invalid or expired session. Please log in again.");
  }
}
```

### 6.2. Using the Checker in a Server Action

Use the `getAuthenticatedUserUid` to protect a critical action, like creating a post.

```typescript
// app/actions/data-actions.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getAuthenticatedUserUid } from "@/lib/server-utils";

export async function createPostAction(formData: FormData) {
  try {
    // 1. 🛑 SECURITY CHECK: Get the authenticated user's UID
    const uid = await getAuthenticatedUserUid(); 
    
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    // 2. 💾 SECURE DATABASE WRITE: Use the UID for ownership
    await adminDb.collection("posts").add({
      title,
      content,
      authorUid: uid, // PROOF OF OWNERSHIP
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
```

-----

## 7\. 🚀 Advanced Route Protection (Middleware)

For the best UX and security, use **Next.js Middleware** to check the session cookie **before** the page even starts rendering. This prevents the "flicker" issue inherent in the client-side `withAuth` HOC.

Create a file at the root of your project: `middleware.ts`.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Get a list of protected routes (or use a pattern match)
const PROTECTED_ROUTES = ['/dashboard', '/profile'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the route is protected
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const sessionCookie = request.cookies.get('session')?.value;
    
    // We cannot use the full Firebase Admin SDK here due to the Edge runtime,
    // so we rely on the presence of the cookie for a fast check. 
    // The Server Action security check (Section 6) is the final defense.

    if (!sessionCookie) {
      // Redirect to login page
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // You can optionally call a lightweight API Route here to verify the token 
    // against Firebase for a stronger middleware check, but simply checking 
    // cookie presence is the standard quick-check for route access.
  }

  return NextResponse.next();
}

// Optionally define which paths the middleware should run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

This completes the professional cycle:

1.  **Client:** Logs in, gets ID Token.
2.  **Server Action (Cookie Setter):** Receives ID Token, mints and sets secure session cookie.
3.  **Middleware:** Checks for cookie presence and redirects unauthorized users *before* page render (fast UX).
4.  **Server Actions (Data):** Verifies the cookie using Firebase Admin SDK for all critical operations (ultimate security).