#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Supabase configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('📝 Please copy .env.example to .env and add your Supabase credentials:');
  console.log('   cp .env.example .env\n');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

let hasErrors = false;

// Check SUPABASE_URL
if (!envVars.EXPO_PUBLIC_SUPABASE_URL || envVars.EXPO_PUBLIC_SUPABASE_URL === 'your_supabase_project_url_here') {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is not set or still has the placeholder value');
  hasErrors = true;
} else {
  try {
    new URL(envVars.EXPO_PUBLIC_SUPABASE_URL);
    console.log('✅ EXPO_PUBLIC_SUPABASE_URL is valid');
  } catch (error) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_URL is not a valid URL');
    hasErrors = true;
  }
}

// Check SUPABASE_ANON_KEY
if (!envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY || envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is not set or still has the placeholder value');
  hasErrors = true;
} else {
  console.log('✅ EXPO_PUBLIC_SUPABASE_ANON_KEY is set');
}

if (hasErrors) {
  console.log('\n📖 Please update your .env file with your actual Supabase credentials.');
  console.log('   You can find these in your Supabase project dashboard under Settings > API');
  process.exit(1);
} else {
  console.log('\n🎉 Supabase configuration looks good!');
  console.log('   You can now start your app with: npx expo start');
}