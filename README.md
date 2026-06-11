# FLACCID — Pine Dunes Tournament Tracker

Live leaderboard for the FLACCID tournament at Pine Dunes Resort & Golf Club.

Deployed to Vercel with Firebase Realtime Database for real-time score sync across all devices.

## Deployment Instructions

### Step 1: Create a Firebase Project (2 minutes)

1. Go to [firebase.google.com](https://firebase.google.com) and sign in with a Google account
2. Click **"Go to console"** (top right)
3. Click **"+ Create project"** or **"Add project"**
4. Name it anything (e.g., "FLACCID")
5. Accept the defaults, click **Create project**
6. Wait for it to initialize, then click **Continue**

### Step 2: Set Up Realtime Database

1. In the Firebase console, on the left menu, click **Build** > **Realtime Database**
2. Click **Create Database**
3. Choose **Start in test mode** (you can set rules later if needed)
4. Choose the default location (closest to you is fine)
5. Click **Enable**

You now have a Realtime Database running.

### Step 3: Get Your Firebase Config

1. In the Firebase console, click the gear icon (⚙️) at the top left
2. Click **Project settings**
3. Scroll down to **Your apps** section
4. Click the **</>** (web) icon if you don't see it
5. Copy all the config values you see (looks like):
   ```
   apiKey: "AIzaSy..."
   authDomain: "your-project.firebaseapp.com"
   databaseURL: "https://your-project.firebaseio.com"
   projectId: "your-project"
   storageBucket: "your-project.appspot.com"
   messagingSenderId: "123456..."
   appId: "1:123456:web:abc123..."
   ```

### Step 4: Deploy to Vercel

1. Push this code to a GitHub repo (or download the ZIP and upload it to GitHub)
2. Go to [vercel.com](https://vercel.com) and sign in (or sign up with GitHub)
3. Click **Add new...** > **Project**
4. Select your GitHub repo (or upload the ZIP)
5. Vercel will auto-detect it's a Next.js project
6. **Before clicking "Deploy"**, scroll down to **Environment Variables**
7. Add the 7 Firebase variables from Step 3:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
8. Click **Deploy**

Vercel will build and deploy your app. It'll give you a live URL (something like `your-project.vercel.app`).

### Step 5: Share the Link

Copy the Vercel URL and send it to your players. They can now:
- View the live leaderboard
- Enter scores (no password needed)
- See the records and course info
- Everything syncs in real-time

Only you can access the **Setup tab** (password: `FLACCID2026!`) to modify rosters, pairings, etc.

## Local Development

If you want to test locally before deploying:

1. Clone/download this repo
2. Copy `.env.local.example` to `.env.local` and fill in your Firebase config
3. Run `npm install`
4. Run `npm run dev`
5. Open http://localhost:3000

## Firebase Security

The database is in **test mode** by default, which allows reads/writes from anyone. For a real tournament, you might want to set up security rules in Firebase, but for this use case it's fine.

If you want to lock it down later, go to Firebase Console > Realtime Database > Rules and set them to only allow authenticated users or specific IP ranges.

---

Questions? Check the code comments or reach out!
