const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('Applying availability migration...')
    
    // Drop the old unique constraint
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS "tutor_availability_tutor_id_day_of_week_key";
    `)
    console.log('✅ Dropped old unique constraint')
    
    // Create supporting index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "tutor_availability_tutor_id_day_of_week_idx"
      ON "tutor_availability"("tutor_id", "day_of_week");
    `)
    console.log('✅ Created supporting index')
    
    // Create new unique constraint for slots
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "tutor_availability_tutor_id_day_of_week_start_time_end_time_key"
      ON "tutor_availability"("tutor_id", "day_of_week", "start_time", "end_time");
    `)
    console.log('✅ Created new unique constraint for slots')
    
    console.log('\n✅ Migration applied successfully!')
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()

