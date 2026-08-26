import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaClient: PrismaClient
try {
  prismaClient =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
} catch {
  console.warn('[AI Studio] Database not connected — using mock proxy')
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
    count: async () => 0,
    upsert: async (d: any) => d?.create ?? {},
  }
  prismaClient = new Proxy({} as PrismaClient, {
    get: () => noOp,
  })
}

export const db = prismaClient
export const prisma = prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db