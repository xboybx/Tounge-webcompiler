// Run this script to fix the MongoDB text index issue
// Usage: node scripts/fix-index.js

const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

// Try to load MONGODB_URI from .env.local
let mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri) {
    try {
        const envLocalPath = path.join(__dirname, '..', '.env.local');
        if (fs.existsSync(envLocalPath)) {
            const envLocal = fs.readFileSync(envLocalPath, 'utf8');
            const match = envLocal.match(/MONGODB_URI=(.*)/);
            if (match) mongodbUri = match[1].trim();
        }
    } catch (e) {
        console.log('Could not read .env.local');
    }
}

const MONGODB_URI = mongodbUri || 'mongodb://localhost:27017/code-craft';

async function fixIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);

        const db = mongoose.connection.db;
        const collection = db.collection('snippets');

        console.log('Dropping old text index...');
        try {
            await collection.dropIndex('title_text_description_text_tags_text');
            console.log('✅ Old index dropped successfully');
        } catch (err) {
            console.log('ℹ️ No old index to drop (this is fine)');
        }

        console.log('Creating new text index with correct configuration...');
        await collection.createIndex(
            { title: 'text', description: 'text', tags: 'text' },
            { default_language: 'none', language_override: 'none' }
        );
        console.log('✅ New index created successfully');

        console.log('\n🎉 Index fixed! You can now save snippets.');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixIndex();
