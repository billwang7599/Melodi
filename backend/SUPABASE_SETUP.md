# Melodi Backend - Supabase Migration

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/in and create a new project
3. Wait for the project to be fully provisioned

### 2. Create the Users Table

In your Supabase project dashboard:

1. Go to the SQL Editor
2. Run the following SQL to create the users table:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations for users" ON users
    FOR ALL USING (true);
```

### 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to Settings > API
2. Copy your Project URL and anon/public key

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values:
   ```
   PORT=3000
   JWT_SECRET=your_strong_jwt_secret_here
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 5. Run the Application

```bash
npm run dev
```

## Migration Changes

- Replaced SQLite with Supabase PostgreSQL database
- Updated authentication controller to use Supabase client
- Removed SQLite dependencies and files
- Added environment variables for Supabase configuration
- Maintained the same API endpoints and functionality

## Database Schema

The users table structure remains the same:
- `id`: Primary key (auto-incrementing)
- `email`: Unique email address
- `username`: User's display name
- `password`: Hashed password
- `created_at`: Timestamp of account creation

## Security Notes

- Row Level Security (RLS) is enabled on the users table
- Make sure to use a strong JWT secret in production
- Consider implementing more restrictive RLS policies based on your needs