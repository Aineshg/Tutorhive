const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding study plans data...')

  // Find Student1 specifically
  const student1 = await prisma.user.findFirst({
    where: {
      name: {
        contains: 'Student1',
        mode: 'insensitive'
      }
    },
    include: {
      student: true
    }
  })

  if (!student1 || !student1.student) {
    console.log('⚠️  Student1 not found. Please create a user named "Student1" with a student profile first.')
    return
  }

  console.log(`✅ Found Student1: ${student1.name} (ID: ${student1.id})`)

  // Get all tutors
  const tutorUsers = await prisma.user.findMany({
    where: {
      tutor: {
        isNot: null
      }
    },
    include: {
      tutor: true
    }
  })

  if (tutorUsers.length < 3) {
    console.log(`⚠️  Need at least 3 tutors to assign different tutors to each study plan. Found: ${tutorUsers.length}`)
    return
  }

  console.log(`✅ Found ${tutorUsers.length} tutors`)

  // Sample study plans data
  const studyPlansData = [

    {
      title: 'Master Calculus in 3 Months',
      description: 'A comprehensive study plan to master calculus concepts from basics to advanced applications.',
      subject: 'Mathematics',
      difficulty_level: 'intermediate',
      duration_weeks: 12,
      time_commitment: '5-7 hours/week',
      learning_goals: 'Master derivatives, integrals, and their applications. Understand limits, continuity, and advanced calculus concepts.',
      status: 'active',
      modules: [
        {
          title: 'Week 1: Limits and Continuity',
          description: 'Foundation concepts for calculus',
          week_number: 1,
          order_index: 0,
          tasks: [
            { title: 'Understanding Limits', description: 'Read Chapter 2.1-2.3, complete exercises', task_type: 'reading' },
            { title: 'Continuity and Discontinuity', description: 'Practice problems and video review', task_type: 'practice' },
            { title: 'Limit Laws and Theorems', description: 'Apply limit laws to solve problems', task_type: 'assignment' }
          ]
        },
        {
          title: 'Week 2: Introduction to Derivatives',
          description: 'Basic derivative concepts and rules',
          week_number: 2,
          order_index: 1,
          tasks: [
            { title: 'Definition of Derivative', description: 'Understand the derivative as a limit', task_type: 'reading' },
            { title: 'Power Rule and Basic Rules', description: 'Master fundamental differentiation rules', task_type: 'practice' },
            { title: 'Product and Quotient Rules', description: 'Apply rules to complex functions', task_type: 'assignment' }
          ]
        },
        {
          title: 'Week 3: Advanced Derivatives',
          description: 'Chain rule and implicit differentiation',
          week_number: 3,
          order_index: 2,
          tasks: [
            { title: 'Chain Rule', description: 'Differentiate composite functions', task_type: 'reading' },
            { title: 'Implicit Differentiation', description: 'Find derivatives of implicit functions', task_type: 'practice' },
            { title: 'Related Rates Problems', description: 'Apply derivatives to real-world scenarios', task_type: 'assignment' }
          ]
        }
      ]
    },
    {
      title: 'Physics Fundamentals',
      description: 'Learn the fundamental principles of physics including mechanics, thermodynamics, and waves.',
      subject: 'Physics',
      difficulty_level: 'beginner',
      duration_weeks: 8,
      time_commitment: '3-5 hours/week',
      learning_goals: 'Understand basic physics concepts including motion, forces, energy, and thermodynamics.',
      status: 'active',
      modules: [
        {
          title: 'Week 1: Motion and Forces',
          description: 'Introduction to kinematics and dynamics',
          week_number: 1,
          order_index: 0,
          tasks: [
            { title: 'Position, Velocity, and Acceleration', description: 'Understand basic motion concepts', task_type: 'reading' },
            { title: 'Newton\'s Laws of Motion', description: 'Study and apply Newton\'s three laws', task_type: 'video' },
            { title: 'Force Diagrams', description: 'Practice drawing and analyzing force diagrams', task_type: 'practice' }
          ]
        },
        {
          title: 'Week 2: Energy and Momentum',
          description: 'Conservation laws in physics',
          week_number: 2,
          order_index: 1,
          tasks: [
            { title: 'Kinetic and Potential Energy', description: 'Learn about different forms of energy', task_type: 'reading' },
            { title: 'Conservation of Energy', description: 'Solve problems using energy conservation', task_type: 'practice' },
            { title: 'Momentum and Collisions', description: 'Understand momentum and elastic/inelastic collisions', task_type: 'assignment' }
          ]
        }
      ]
    },
    {
      title: 'Computer Science Algorithms',
      description: 'Comprehensive study of algorithms and data structures for programming interviews.',
      subject: 'Computer Science',
      difficulty_level: 'intermediate',
      duration_weeks: 8,
      time_commitment: '7-10 hours/week',
      learning_goals: 'Master common algorithms and data structures. Prepare for technical interviews.',
      status: 'completed',
      modules: [
        {
          title: 'Week 1: Arrays and Strings',
          description: 'Basic data structures and string manipulation',
          week_number: 1,
          order_index: 0,
          tasks: [
            { title: 'Array Operations', description: 'Practice array manipulation and traversal', task_type: 'practice' },
            { title: 'String Algorithms', description: 'Learn string matching and manipulation', task_type: 'reading' },
            { title: 'Array Problems', description: 'Solve 10 array-based coding problems', task_type: 'assignment' }
          ]
        },
        {
          title: 'Week 2: Linked Lists',
          description: 'Understanding and implementing linked lists',
          week_number: 2,
          order_index: 1,
          tasks: [
            { title: 'Singly Linked Lists', description: 'Implement and manipulate singly linked lists', task_type: 'practice' },
            { title: 'Doubly Linked Lists', description: 'Learn about doubly linked lists', task_type: 'reading' },
            { title: 'Linked List Problems', description: 'Solve linked list coding challenges', task_type: 'assignment' }
          ]
        }
      ]
    }
  ]

  // Create study plans for Student1 with different tutors
  for (let i = 0; i < studyPlansData.length; i++) {
    const planData = studyPlansData[i]
    const tutorUser = tutorUsers[i % tutorUsers.length]
    
    // Get tutor record
    const tutor = await prisma.tutor.findUnique({
      where: { user_id: tutorUser.id }
    })

    if (!tutor) {
      console.log(`⚠️  Skipping study plan ${i + 1} - tutor not found`)
      continue
    }

    // Calculate progress for active/completed plans
    let progressPercentage = 0
    if (planData.status === 'completed') {
      progressPercentage = 100
    } else if (planData.status === 'active') {
      // Random progress between 30-80% for active plans
      progressPercentage = Math.floor(Math.random() * 50) + 30
    }

    const studyPlan = await prisma.studyPlan.create({
      data: {
        student_id: student1.id,
        tutor_id: tutor.id,
        title: planData.title,
        description: planData.description,
        subject: planData.subject,
        difficulty_level: planData.difficulty_level,
        duration_weeks: planData.duration_weeks,
        time_commitment: planData.time_commitment,
        learning_goals: planData.learning_goals,
        status: planData.status,
        progress_percentage: progressPercentage,
        started_at: planData.status !== 'pending' ? new Date() : null,
        completed_at: planData.status === 'completed' ? new Date() : null,
        modules: {
          create: planData.modules.map((moduleData, moduleIndex) => ({
            title: moduleData.title,
            description: moduleData.description,
            week_number: moduleData.week_number,
            order_index: moduleData.order_index,
            tasks: {
              create: moduleData.tasks.map((taskData, taskIndex) => {
                // Determine if task should be completed based on progress
                const taskCompleted = progressPercentage > 0 && 
                  (taskIndex < moduleData.tasks.length * (progressPercentage / 100) || 
                   planData.status === 'completed')
                
                return {
                  title: taskData.title,
                  description: taskData.description,
                  task_type: taskData.task_type,
                  status: taskCompleted ? 'completed' : 'pending',
                  order_index: taskIndex,
                  completed_at: taskCompleted ? new Date() : null
                }
              })
            }
          }))
        }
      },
      include: {
        modules: {
          include: {
            tasks: true
          }
        }
      }
    })

    // Create progress records for completed tasks
    if (progressPercentage > 0) {
      for (const module of studyPlan.modules) {
        for (const task of module.tasks) {
          if (task.status === 'completed') {
            await prisma.studyPlanProgress.create({
              data: {
                study_plan_id: studyPlan.id,
                task_id: task.id,
                student_id: student1.id,
                completed_at: task.completed_at || new Date()
              }
            })
          }
        }
      }
    }

    console.log(`✅ Created study plan: "${studyPlan.title}" for Student1 with tutor: ${tutorUser.name}`)
  }

  console.log('✨ Study plans seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding study plans:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

