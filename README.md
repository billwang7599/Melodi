# Melodi

se390

## Backend Setup

1. Navigate to the backend
   ```bash
   cd backend
   ```

2. Install backend dependencies
   ```bash
   npm install
   ```

3. Start the backend development server
   ```bash
   npm run dev
   ```

Backend server will run on `http://localhost:3000` and provide API endpoints for authentication and user management.

## Supabase Authentication Setup

This app uses Supabase for authentication. Follow these steps to configure it:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/in and create a new project
3. Wait for the project to be fully provisioned

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace the placeholder values with your actual Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication > Settings**
2. Make sure **Enable email confirmations** is turned ON for production
3. For development, you can turn it OFF to skip email verification

The app will automatically validate your Supabase configuration when you start it. Check the console for any configuration errors.

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
