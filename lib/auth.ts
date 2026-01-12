// lib/auth.ts
import { db } from "./db";
import bcrypt from "bcryptjs";
import { cookies } from 'next/headers';

type UserRow = {
  id: number;
  username: string;
  role: string;
  password: string;
};

export async function authenticate(username: string, password: string) {
  const rows = await db`SELECT * FROM users WHERE username = ${username}`;
  const user = rows[0];

  if (user && await bcrypt.compare(password, user.password)) {
    return { id: user.id, username: user.username, role: user.role };
  }

  return null;
}

export async function setAuth(id: string) {
  const cookieStore = await cookies();
  cookieStore.set('user_id', id, { httpOnly: true, path: '/', maxAge: 60 * 60 * 6 });
}
