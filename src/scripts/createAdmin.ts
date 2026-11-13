/**
 * Creates the first admin account, or resets an existing account's password and makes it an admin
 * (use this if the admin password is forgotten).
 *
 *   npm run create-admin
 *
 * Non-interactive use: set ADMIN_NAME, ADMIN_USERNAME and ADMIN_PASSWORD in the environment.
 */
import readline from 'readline';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { UserModel } from '../models/User';
import { hashPassword } from '../utils/password';
import { createUserSchema } from '../validators/user';

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Suppress echo of typed characters for password prompts.
    const internal = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    internal._writeToOutput = (s: string) => {
      if (!muted) internal.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
    muted = hidden;
  });
}

async function readInput() {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    return {
      name: process.env.ADMIN_NAME || 'Administrator',
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    };
  }

  console.log('\nCreate an admin account for Tilak Industries\n');
  const name = await ask('Full name: ');
  const username = await ask('Username: ');
  const password = await ask('Password (min 8 characters): ', true);
  const confirm = await ask('Confirm password: ', true);
  if (password !== confirm) throw new Error('Passwords do not match');
  return { name, username, password };
}

async function main() {
  const parsed = createUserSchema.safeParse({ ...(await readInput()), role: 'admin' });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
  }
  const input = parsed.data;

  await connectDB();
  const passwordHash = await hashPassword(input.password);
  const existing = await UserModel.findOne({ username: input.username });

  if (existing) {
    existing.name = input.name;
    existing.role = 'admin';
    existing.active = true;
    existing.passwordHash = passwordHash;
    existing.tokenVersion += 1;
    await existing.save();
    console.log(`\n✔ Existing user "${input.username}" is now an admin with the new password.`);
  } else {
    await UserModel.create({ name: input.name, username: input.username, role: 'admin', passwordHash });
    console.log(`\n✔ Admin "${input.username}" created. You can now log in.`);
  }
}

main()
  .catch((error) => {
    console.error(`\n✖ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
