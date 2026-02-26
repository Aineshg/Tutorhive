const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.session.deleteMany()
  await prisma.tutor.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create realistic users who are both tutors and students
  console.log('Creating users (tutors who are also students)...')
  const users = [
    {
      name: 'Michael Chen',
      email: 'michael.chen@university.edu',
      role: 'student',
      avatar_url: null,
      tutor: {
        phone: '+1-555-0101',
        subjects: ['Mathematics', 'Calculus', 'Linear Algebra', 'Statistics'],
        experience: '5+ years tutoring mathematics at university level',
        semester: 'Graduate Student - MS Mathematics',
        bio: 'Graduate student in Mathematics with a passion for teaching. I specialize in calculus, linear algebra, and statistics. I help students understand complex concepts through clear explanations and practical examples.',
        hourly_rate: 45.0,
        rating: 4.8,
        total_reviews: 23,
        is_verified: true
      },
      student: {
        semester: 'Graduate - MS Mathematics',
        gpa: 3.9,
        subjects: ['Mathematics', 'Physics'],
        study_hours: 35,
        progress_score: 88,
        current_streak: 12,
        level: 'Advanced',
        bio: 'Graduate student pursuing Masters in Mathematics. Currently learning advanced physics applications.',
      }
    },
    {
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@university.edu',
      role: 'student',
      avatar_url: null,
      tutor: {
        phone: '+1-555-0102',
        subjects: ['Computer Science', 'Programming', 'Data Structures', 'Algorithms'],
        experience: '4+ years software development and tutoring experience',
        semester: 'Graduate Student - MS Computer Science',
        bio: 'Computer science graduate student with industry experience. I teach programming fundamentals, data structures, and algorithms with real-world applications. I make complex topics accessible through hands-on examples.',
        hourly_rate: 50.0,
        rating: 4.9,
        total_reviews: 31,
        is_verified: true
      },
      student: {
        semester: 'Graduate - MS Computer Science',
        gpa: 3.8,
        subjects: ['Computer Science', 'Mathematics'],
        study_hours: 40,
        progress_score: 90,
        current_streak: 15,
        level: 'Advanced',
        bio: 'Graduate student in Computer Science. Always learning new technologies and mathematical concepts.',
      }
    },
    {
      name: 'David Kim',
      email: 'david.kim@university.edu',
      role: 'student',
      avatar_url: null,
      tutor: {
        phone: '+1-555-0103',
        subjects: ['Chemistry', 'Organic Chemistry', 'Biochemistry'],
        experience: '6+ years chemistry research and tutoring',
        semester: 'PhD Student - Chemistry',
        bio: 'PhD student in Chemistry with extensive research experience. I specialize in organic chemistry and biochemistry. I help students master reaction mechanisms, molecular structures, and laboratory techniques.',
        hourly_rate: 55.0,
        rating: 4.7,
        total_reviews: 19,
        is_verified: true
      },
      student: {
        semester: 'Graduate - PhD Chemistry',
        gpa: 3.7,
        subjects: ['Chemistry', 'Biology'],
        study_hours: 30,
        progress_score: 85,
        current_streak: 8,
        level: 'Advanced',
        bio: 'PhD student in Chemistry exploring advanced biology concepts for interdisciplinary research.',
      }
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      role: 'student',
      avatar_url: null,
      tutor: {
        phone: '+1-555-0104',
        subjects: ['Physics', 'Mechanics', 'Electromagnetism', 'Quantum Physics'],
        experience: '5+ years physics research and teaching',
        semester: 'Graduate Student - MS Physics',
        bio: 'Physics graduate student with expertise in mechanics and electromagnetism. I make physics concepts clear and help students solve complex problems through step-by-step guidance.',
        hourly_rate: 48.0,
        rating: 4.8,
        total_reviews: 27,
        is_verified: true
      },
      student: {
        semester: 'Graduate - MS Physics',
        gpa: 3.8,
        subjects: ['Physics', 'Mathematics'],
        study_hours: 32,
        progress_score: 87,
        current_streak: 10,
        level: 'Advanced',
        bio: 'Graduate student in Physics. Continuously learning advanced mathematical methods for physics applications.',
      }
    }
  ]

  // Create users with both tutor and student profiles
  for (const userData of users) {
    const { tutor, student, ...userInfo } = userData
    const user = await prisma.user.create({
      data: {
        ...userInfo,
        password_hash: hashedPassword,
        tutor: {
          create: tutor
        },
        student: {
          create: student
        }
      }
    })
    console.log(`Created ${userInfo.name} (Email: ${userInfo.email}) - Tutor + Student`)
  }

  console.log('\n Seed completed successfully!')
  console.log('\n Login credentials for all users:')
  console.log('   Password: password123')
  console.log('\n Created users (all are tutors who are also students):')
  users.forEach(u => {
    console.log(`   - ${u.name}`)
    console.log(`     Email: ${u.email}`)
    console.log(`     Tutor Subjects: ${u.tutor.subjects.join(', ')}`)
    console.log(`     Hourly Rate: $${u.tutor.hourly_rate}/hr`)
    console.log(`     Rating: ${u.tutor.rating}  (${u.tutor.total_reviews} reviews)`)
    console.log('')
  })
  console.log('Tip: All users can login as students to book sessions with other tutors!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
