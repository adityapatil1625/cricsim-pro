# Firebase Setup Guide for CricSim Pro

This guide walks you through setting up Firebase for authentication and database.

## Prerequisites

- Firebase account (free)
- Node.js installed
- Project already has `firebase` package installed

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://firebase.google.com/console)
2. Click "Add project"
3. Enter project name (e.g., "cricsim-pro")
4. Continue through setup (disable analytics is fine)
5. Click "Create project" and wait for completion

### 2. Enable Firestore Database

1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Select region (closest to your users)
4. Start in **test mode** (for development)
   - ⚠️ Remember to set security rules before production!
5. Click "Enable"

### 3. Enable Authentication

1. Go to "Build" → "Authentication"
2. Click "Get Started"
3. Click "Email/Password" provider
4. Enable "Email/Password" toggle
5. Click "Save"

### 4. Get Firebase Configuration

1. Go to Project Settings (⚙️ icon, top-right)
2. Go to "General" tab
3. Scroll to "Your apps" section
4. Look for Web app configuration
5. If no web app, click "Add app" → Select "Web" (</> icon)
6. Copy the Firebase config object

Example config structure:
```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:xxxxxxxx"
}
```

### 5. Add Credentials to .env

1. Open `.env.firebase` in project root
2. Fill in the values from Firebase console:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
VITE_FIREBASE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxx
```

3. Save the file

### 6. Verify Setup

Run the dev server:
```bash
npm run dev
```

If you see errors in browser console, check:
- ✅ .env.firebase is in project root (not src/)
- ✅ Variable names start with `VITE_` for Vite to expose them
- ✅ All 6 config values are filled in
- ✅ No extra spaces or quotes in .env.firebase

## Project Structure

### Files Created

- **src/config/firebaseConfig.js** - Firebase initialization
- **src/services/authService.js** - Authentication functions
- **src/services/matchService.js** - Match & tournament storage
- **src/pages/AuthPage.jsx** - Login/signup UI
- **src/pages/UserProfile.jsx** - User profile & stats
- **.env.firebase** - Environment configuration template

### Authentication Flow

1. **New User**: Click "Sign Up" on AuthPage
   - Creates Firebase account
   - Creates user profile in Firestore with stats
   - Redirects to menu

2. **Existing User**: Click "Sign In" on AuthPage
   - Authenticates with email/password
   - Redirects to menu

3. **Profile Access**: Click profile button on menu
   - Shows user info and stats
   - Displays match history
   - Logout option available

## Database Structure

### Users Collection

```
users/
├── {userId}/
│   ├── email: string
│   ├── displayName: string
│   ├── createdAt: timestamp
│   ├── stats: {
│   │   ├── matches: number
│   │   ├── wins: number
│   │   └── winRate: number
│   └── ...
```

### Matches Collection

```
matches/
├── {matchId}/
│   ├── userId: string
│   ├── team1: string
│   ├── team2: string
│   ├── team1Runs: number
│   ├── team2Runs: number
│   ├── winner: string
│   ├── matchData: {...}
│   └── timestamp: timestamp
```

### Tournaments Collection

```
tournaments/
├── {tournamentId}/
│   ├── userId: string
│   ├── name: string
│   ├── teams: [...]
│   ├── matches: [...]
│   ├── createdAt: timestamp
│   └── completedAt: timestamp
```

## Security Rules (Test Mode)

Current test mode rules allow all access:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Before Production**, update to:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can read all matches, write only their own
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow create, write: if request.auth.uid == resource.data.userId;
    }
    
    // Users can read all tournaments, write only their own
    match /tournaments/{tournId} {
      allow read: if request.auth != null;
      allow create, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

## Usage Examples

### Signup
```javascript
import { signup } from '@/services/authService';

const user = await signup('user@example.com', 'password123', 'John Doe');
console.log(user.uid); // New user ID
```

### Login
```javascript
import { login } from '@/services/authService';

const user = await login('user@example.com', 'password123');
console.log(user.email); // Logged in user email
```

### Save Match
```javascript
import { saveMatch } from '@/services/matchService';

const matchId = await saveMatch(userId, {
  team1: 'Team A',
  team2: 'Team B',
  team1Runs: 150,
  team2Runs: 145,
  winner: 'Team A',
  // ... other match data
});
```

### Get Match History
```javascript
import { getUserMatches } from '@/services/matchService';

const matches = await getUserMatches(userId, 10); // Last 10 matches
matches.forEach(match => {
  console.log(`${match.team1} vs ${match.team2}`);
});
```

## Troubleshooting

### "Firebase config is not valid"
- ✅ Check all 6 values are in .env.firebase
- ✅ Values have no extra spaces
- ✅ File is named exactly `.env.firebase`

### "User not authenticated"
- ✅ Make sure you're signed in at /auth page first
- ✅ Check browser console for auth errors
- ✅ Try signing up as new user

### "Firestore is not initialized"
- ✅ Make sure Firebase credentials are filled in .env.firebase
- ✅ Restart dev server after updating .env file
- ✅ Check browser console for Firebase initialization errors

### "Cannot read property 'uid' of null"
- ✅ User is not authenticated
- ✅ Need to call signup/login first
- ✅ Check auth state in browser console

## Next Steps

1. ✅ Test signup/login flow
2. ✅ Update match completion to save to Firestore
3. ✅ Add match history to tournament completion
4. ✅ Implement real-time match syncing
5. ✅ Add user statistics dashboard
6. ✅ Set proper security rules before production

## Free Tier Limits (More than enough for dev)

- **Storage**: 1 GB total
- **Concurrent connections**: 100
- **Read operations**: 50,000/day
- **Write operations**: 20,000/day
- **Delete operations**: 20,000/day

## Support

For issues:
1. Check browser console for errors
2. Check Firebase Console Logs
3. Verify .env.firebase values
4. Restart dev server
5. Clear browser cache (Ctrl+Shift+Delete)

