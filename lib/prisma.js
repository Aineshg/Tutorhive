import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Force a fresh Prisma client instance in development
// This ensures we always have the latest schema models
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = new PrismaClient()
  
  // Log available models in development
  const models = Object.keys(globalForPrisma.prisma).filter(
    key => !key.startsWith('_') && 
    typeof globalForPrisma.prisma[key] === 'object' && 
    globalForPrisma.prisma[key] !== null &&
    globalForPrisma.prisma[key].create !== undefined
  )
  console.log('Initialized Prisma Client with models:', models.join(', '))
  
  // Verify key models exist
  if (globalForPrisma.prisma.connection) {
    console.log('✓ Connection model is available')
  } else {
    console.warn('⚠ Connection model is NOT available - restart the server!')
  }
  
  if (globalForPrisma.prisma.studyPlan) {
    console.log('✓ StudyPlan model is available')
  } else {
    console.warn('⚠ StudyPlan model is NOT available - restart the server!')
  }
  
  if (globalForPrisma.prisma.module) {
    console.log('✓ Module model is available')
  } else {
    console.warn('⚠ Module model is NOT available - restart the server!')
  }
  
  if (globalForPrisma.prisma.task) {
    console.log('✓ Task model is available')
  } else {
    console.warn('⚠ Task model is NOT available - restart the server!')
  }
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
}

const prisma = globalForPrisma.prisma

export default prisma

