# Firebase Quick Reference

## 🚀 Getting Started (5 minutes)

### Step 1: Firebase Project Setup
```bash
# Go to firebase.google.com
# 1. Create new project → Continue through prompts
# 2. Go to Build → Firestore Database → Create Database (Test Mode)
# 3. Go to Build → Authentication → Email/Password (Enable)
# 4. Go to Project Settings → Web App → Copy config
```

### Step 2: Add Credentials
```bash
# Open .env.firebase and fill:
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

### Step 3: Test
```bash
npm run dev
# Visit http://localhost:5173/auth
# Create account and verify it works
```

---

## 📚 Common Tasks

### Get Current User
```javascript
import authService from '@/services/authService';

const user = authService.getCurrentUser();
// { uid, email, displayName, metadata: { creationTime, ... } }
```

### Use Auth State in Component
```javascript
import useAuth from '@/hooks/useAuth';

export default MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <Loading />;
  if (!isAuthenticated) return <Redirect to="/auth" />;
  
  return <div>Hello {user.displayName}</div>;
}
```

### Sign Up User
```javascript
import { signup } from '@/services/authService';

try {
  const user = await signup('user@email.com', 'password123', 'John Doe');
  console.log('User created:', user.uid);
} catch (error) {
  console.error('Signup failed:', error.message);
}
```

### Login User
```javascript
import { login } from '@/services/authService';

try {
  const user = await login('user@email.com', 'password123');
  console.log('Logged in:', user.email);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Logout User
```javascript
import { logout } from '@/services/authService';

await logout();
// User is now logged out, redirect to /auth
```

### Save Match
```javascript
import { saveMatch } from '@/services/matchService';

const matchData = {
  team1: 'MI',
  team2: 'CSK',
  team1Runs: 165,
  team2Runs: 160,
  winner: 'MI',
  overs: 20,
  // ... other match details
};

try {
  const matchId = await saveMatch(user.uid, matchData);
  console.log('Match saved:', matchId);
} catch (error) {
  console.error('Failed to save:', error.message);
}
```

### Get User's Match History
```javascript
import { getUserMatches } from '@/services/matchService';

// Get last 10 matches
const matches = await getUserMatches(user.uid, 10);

matches.forEach(match => {
  console.log(`${match.team1} vs ${match.team2}`);
  console.log(`Result: ${match.winner}`);
  console.log(`Date: ${match.timestamp.toDate()}`);
});
```

### Save Tournament
```javascript
import { saveTournament } from '@/services/matchService';

const tournData = {
  name: 'IPL Season 2024',
  teams: ['MI', 'CSK', 'RCB', 'KKR'],
  format: 'round-robin',
  matches: [/* match data */],
};

const tournId = await saveTournament(user.uid, tournData);
```

### Get User Tournaments
```javascript
import { getUserTournaments } from '@/services/matchService';

const tournaments = await getUserTournaments(user.uid, 5);

tournaments.forEach(tourn => {
  console.log(`${tourn.name} - ${tourn.status}`);
  console.log(`Teams: ${tourn.teams.join(', ')}`);
});
```

### Update User Stats
```javascript
import { updateUserStats } from '@/services/authService';

await updateUserStats(user.uid, {
  wins: 5,
  matches: 10,
  winRate: 0.5
});
```

---

## 🔥 Firestore Collections

### users/
```
users/{userId}
├── email: string
├── displayName: string
├── createdAt: timestamp
└── stats: {
    ├── matches: number
    ├── wins: number
    └── winRate: number
}
```

### matches/
```
matches/{matchId}
├── userId: string
├── team1: string
├── team2: string
├── team1Runs: number
├── team2Runs: number
├── winner: string
├── timestamp: timestamp
└── matchData: { /* full match data */ }
```

### tournaments/
```
tournaments/{tournId}
├── userId: string
├── name: string
├── teams: array
├── format: string
├── status: string
├── createdAt: timestamp
├── completedAt: timestamp
├── matches: array
├── winner: string
└── stats: { /* tournament stats */ }
```

---

## 🛡️ Protected Routes

Only authenticated users can access main app:

```javascript
// In main.jsx - Already implemented!
<Route
  path="/*"
  element={
    <ProtectedRoute>
      <App />
    </ProtectedRoute>
  }
/>
```

If user not logged in → Redirects to `/auth`

---

## ⚠️ Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Firebase config is not valid` | Missing/invalid credentials | Fill all 6 values in `.env.firebase` |
| `User not authenticated` | Trying to access before login | Call signup/login first, or redirect to `/auth` |
| `Cannot read property 'uid' of null` | No user logged in | Check `getCurrentUser()` returns null |
| `Firestore not initialized` | Missing config | Verify `.env.firebase` is filled |
| `Module not found @/services/authService` | Wrong import path | Check path matches exact file location |

---

## 📁 File Locations

```
✅ Auth Services:     src/services/authService.js
✅ Match Services:    src/services/matchService.js
✅ Firebase Config:   src/config/firebaseConfig.js
✅ Auth Hook:         src/hooks/useAuth.js
✅ Auth UI:           src/pages/AuthPage.jsx
✅ Profile UI:        src/pages/UserProfile.jsx
✅ Credentials:       .env.firebase (⚠️ Don't commit!)
```

---

## 🧪 Testing Auth Flow

1. **Signup**
   - Go to http://localhost:5173/auth
   - Click "Sign Up"
   - Enter email, password, name
   - Check Firestore: should see new user document

2. **Login**
   - Logout (click profile button)
   - Click "Sign In"
   - Enter credentials
   - Should redirect to menu

3. **Match Saving**
   - Complete a match
   - Call `saveMatch(userId, matchData)`
   - Check Firestore: matches collection
   - Go to /profile to see match history

4. **Protected Routes**
   - Try accessing `/` without login
   - Should redirect to `/auth`

---

## 🚀 Deployment Checklist

- [ ] Update Firestore security rules (see FIREBASE_SETUP.md)
- [ ] Remove test data from Firestore
- [ ] Set environment variables on hosting platform
- [ ] Test auth flow on production
- [ ] Monitor Firestore usage limits
- [ ] Enable backups (Firebase Console → Settings)
- [ ] Set up alerts for quota usage
- [ ] Review and update security rules quarterly

---

## 📞 Need Help?

1. **Check browser console** - Most errors logged there
2. **Check Firebase Console** - Firestore Rules & Logs tab
3. **Restart dev server** - After changing `.env.firebase`
4. **Clear browser cache** - Ctrl+Shift+Delete
5. **Read FIREBASE_SETUP.md** - Detailed setup guide
6. **Read FIREBASE_INTEGRATION.md** - Integration guide

---

## 📚 External Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore/manage-data/add-data)
- [Firebase Auth](https://firebase.google.com/docs/auth/where-to-start)
- [Vite Env Vars](https://vitejs.dev/guide/env-and-mode.html)

