'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // Ambil user dari database
    const res = await pool.query(
      'SELECT * FROM "Admin" WHERE username = $1 LIMIT 1',
      [email]
    );

    const user = res.rows[0];

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // Cek password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { error: 'Invalid email or password' };
    }

    // Jika valid, set cookie
    const sessionToken = 'authenticated'; // Ganti dengan JWT di produksi

    cookies().set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 minggu
      path: '/',
    });

    return redirect('/admin');
  } catch (error) {
    console.error(error);
    return { error: 'Internal server error' };
  }
}
