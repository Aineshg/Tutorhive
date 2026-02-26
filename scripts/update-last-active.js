/**
 * One-time script to update last_active_at for all existing users
 * Sets last_active_at to NOW() for all users
 * Run this once to fix existing users
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateLastActive() {
  try {
    console.log('Updating last_active_at for all users...')
    
    // Update all users to set last_active_at to NOW()
    // This gives all users a fresh activity timestamp
    const result = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET last_active_at = NOW() 
      WHERE last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '1 hour'
    `)
    
    console.log(`Updated ${result} users with fresh last_active_at`)
    console.log('Done! All users now have accurate last active tracking.')
  } catch (error) {
    console.error('Error updating last_active_at:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateLastActive()

