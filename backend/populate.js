import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { initDB, query, execute } from './db.js';
import { hashPassword } from './utils/passwordUtils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '.env') });

try {
  await initDB();

  let [user] = await query('SELECT * FROM users WHERE email = ?', ['john@gmail.com']);
  if (!user) {
    const hashedPassword = await hashPassword('password123');
    const result = await execute(
      'INSERT INTO users (name, email, password, location, lastName, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['John Doe', 'john@gmail.com', hashedPassword, 'my city', 'Doe', 'admin']
    );
    [user] = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  }

  const jsonJobs = JSON.parse(
    await readFile(new URL('./utils/mockData.json', import.meta.url))
  );
  const jobs = jsonJobs.map((job) => {
    return [
      job.company,
      job.position,
      job.jobStatus,
      job.jobType,
      job.jobLocation,
      user.id,
    ];
  });

  await execute('DELETE FROM jobs WHERE createdBy = ?', [user.id]);

  for (const jobRow of jobs) {
    await execute(
      'INSERT INTO jobs (company, position, jobStatus, jobType, jobLocation, createdBy) VALUES (?, ?, ?, ?, ?, ?)',
      jobRow
    );
  }

  console.log('Success!!!');
  process.exit(0);
} catch (error) {
  console.log(error);
  process.exit(1);
}
