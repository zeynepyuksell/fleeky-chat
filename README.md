# Fleeky Chat - Real-time Chat App

A React Native chat application built with Expo, TypeScript, Firebase, and Expo Router. Features real-time messaging, user authentication, and a modern UI.

## Features

- 🔐 **User Authentication** - Sign up and sign in with email/password
- 💬 **Real-time Messaging** - Instant message delivery using Firebase Firestore
- 📱 **Modern UI** - Clean and intuitive interface with iOS-style design
- 🗂️ **Chat Rooms** - Create and join different chat rooms
- 👤 **User Profiles** - View account information and manage settings
- 📱 **Cross-platform** - Works on iOS, Android, and Web

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **Firebase** for backend services
  - Authentication
  - Firestore (real-time database)
- **Expo Router** for navigation
- **React Navigation** for tab navigation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Firebase project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd fleeky-chat
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Get your Firebase configuration

### 3. Update Firebase Config

Open `config/firebase.ts` and replace the placeholder configuration with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4. Firestore Security Rules

Set up Firestore security rules to allow authenticated users to read/write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatRooms/{chatRoomId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### 5. Run the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
fleeky-chat/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── _layout.tsx    # Tab navigation
│   │   ├── index.tsx      # Chats list
│   │   └── profile.tsx    # User profile
│   ├── chat/              # Chat screens
│   │   └── [id].tsx       # Individual chat room
│   └── _layout.tsx        # Root layout
├── config/                # Configuration files
│   └── firebase.ts        # Firebase configuration
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication context
│   └── FirebaseContext.tsx # Firebase context
├── assets/                # Static assets
└── package.json
```

## Key Features Implementation

### Authentication Flow
- Users can sign up with email/password
- Automatic navigation between auth and main app
- Protected routes based on authentication state

### Real-time Chat
- Messages are stored in Firestore subcollections
- Real-time updates using `onSnapshot`
- Message timestamps and user information
- Auto-scroll to latest messages

### Chat Rooms
- Create new chat rooms
- List user's chat rooms
- Last message preview
- Real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 