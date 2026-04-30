import SQLite from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const dbPath = process.env.SQLITE_DATABASE_PATH ?? 'playmore.db';
const db = new SQLite(dbPath);

async function createAdmin() {
    const email = 'admin@shopmore.io';
    const password = 'AdminPassword123!';
    const displayName = 'Global Admin';
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    try {
        db.prepare(`
            INSERT INTO users (id, email, passwordHash, displayName, role, createdAt)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, email, passwordHash, displayName, 'admin', now);
        console.log('Admin user created successfully:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (err: any) {
        if (err.message.includes('UNIQUE constraint failed')) {
            // Update existing user to admin
            db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', email);
            console.log('User already exists. Updated role to admin.');
        } else {
            console.error('Failed to create admin user:', err);
        }
    }
}

createAdmin().catch(console.error);
