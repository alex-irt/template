import * as db from './db.mjs';
import fs from 'fs';

export default async function() {
    console.log('Running migrations');

    const files = fs.readdirSync('./src/db/migrations/');

    await db.run('CREATE TABLE IF NOT EXISTS migrations (migration TEXT PRIMARY KEY);');

    let alreadyApplied = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const existing = await db.querySet('SELECT * FROM migrations WHERE migration = $1', file);

        if (existing.length === 0) {
            console.log('Missing migration ' + file + ' running now');
            
            const sql = fs.readFileSync('./src/db/migrations/' + file, 'utf8');

            await db.run(sql);
            await db.insert('migrations', { migration: file });
        } else {
            alreadyApplied += 1;
        }
    }
    console.log(alreadyApplied + ' migrations were already applied');
}