'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Cari admin berdasarkan email
  const admin = await prisma.admin.findUnique({
    where: { username: email }, // Ganti 'username' jika field di Prisma kamu berbeda
  });

  if (!admin) {
    return { error: 'Invalid email or password' };
  }

  // Bandingkan password dan hash
  const passwordMatch = await bcrypt.compare(password, admin.password);

  if (!passwordMatch) {
    return { error: 'Invalid email or password' };
  }

  // Jika berhasil, set session
  const sessionToken = 'authenticated'; // Ganti dengan session/jwt yang aman di produksi

  cookies().set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return redirect('/admin');
}
