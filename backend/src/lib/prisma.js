// Prevent multiple Prisma instances in dev (hot reload)
import { PrismaClient } from '@prisma/client';
const prisma = globalThis.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;
export default prisma;
