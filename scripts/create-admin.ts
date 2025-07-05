import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const username = 'admin@gmail.com'
  const plainPassword = 'alamak' // Ganti sesuai kebutuhan

  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

  try {
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
      },
    })
    console.log('Berhasil membuat admin:', admin)
  } catch (e: any) {
    if (e.code === 'P2002') {
      console.log('Username sudah terdaftar.')
    } else {
      console.error('Gagal membuat admin:', e)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()