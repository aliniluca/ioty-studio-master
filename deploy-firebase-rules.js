#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Firebase Rules and Indexes...');

// Check if firebase-tools is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Firebase CLI not found. Please install it first:');
  console.error('npm install -g firebase-tools');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Not logged into Firebase. Please login first:');
  console.error('firebase login');
  process.exit(1);
}

// Deploy Firestore rules
try {
  console.log('📋 Deploying Firestore rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ Firestore rules deployed successfully!');
} catch (error) {
  console.error('❌ Failed to deploy Firestore rules:', error.message);
}

// Deploy Firestore indexes
try {
  console.log('📊 Deploying Firestore indexes...');
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
  console.log('✅ Firestore indexes deployed successfully!');
} catch (error) {
  console.error('❌ Failed to deploy Firestore indexes:', error.message);
}

console.log('🎉 Firebase deployment completed!');
console.log('');
console.log('📝 Next steps:');
console.log('1. Test your application');
console.log('2. Check Firebase Console for any errors');
console.log('3. Monitor performance in Firebase Analytics'); 