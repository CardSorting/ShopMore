import SQLite from 'better-sqlite3';

const dbPath = process.env.SQLITE_DATABASE_PATH ?? 'playmore.db';
const db = new SQLite(dbPath);

const products = db.prepare('SELECT count(*) as count FROM products').get() as { count: number };
console.log(`Products in DB: ${products.count}`);

const users = db.prepare('SELECT email, role FROM users').all();
console.log('Users in DB:');
console.table(users);
