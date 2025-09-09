import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.timeZonePreference.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.city.deleteMany()
  await prisma.user.deleteMany()

  // Create cities with timezone data
  const cities = await prisma.city.createMany({
    data: [
      // North America
      { name: 'New York', country: 'United States', timezone: 'America/New_York', offset: -300 },
      { name: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles', offset: -480 },
      { name: 'Chicago', country: 'United States', timezone: 'America/Chicago', offset: -360 },
      { name: 'Toronto', country: 'Canada', timezone: 'America/Toronto', offset: -300 },
      { name: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver', offset: -480 },
      { name: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City', offset: -360 },
      { name: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo', offset: -180 },

      // Europe
      { name: 'London', country: 'United Kingdom', timezone: 'Europe/London', offset: 0 },
      { name: 'Paris', country: 'France', timezone: 'Europe/Paris', offset: 60 },
      { name: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', offset: 60 },
      { name: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid', offset: 60 },
      { name: 'Rome', country: 'Italy', timezone: 'Europe/Rome', offset: 60 },
      { name: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam', offset: 60 },
      { name: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm', offset: 60 },
      { name: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow', offset: 180 },

      // Asia
      { name: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai', offset: 240 },
      { name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', offset: 540 },
      { name: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai', offset: 480 },
      { name: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong', offset: 480 },
      { name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', offset: 480 },
      { name: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok', offset: 420 },
      { name: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', offset: 330 },
      { name: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul', offset: 540 },
      { name: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta', offset: 420 },

      // Oceania
      { name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', offset: 600 },
      { name: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne', offset: 600 },
      { name: 'Auckland', country: 'New Zealand', timezone: 'Pacific/Auckland', offset: 720 },

      // Africa
      { name: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo', offset: 120 },
      { name: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos', offset: 60 },
      { name: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg', offset: 120 },

      // South America
      { name: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', offset: -180 },
      { name: 'Lima', country: 'Peru', timezone: 'America/Lima', offset: -300 },
      { name: 'Santiago', country: 'Chile', timezone: 'America/Santiago', offset: -240 },

      // Middle East
      { name: 'Tel Aviv', country: 'Israel', timezone: 'Asia/Jerusalem', offset: 120 },
      { name: 'Riyadh', country: 'Saudi Arabia', timezone: 'Asia/Riyadh', offset: 180 }
    ]
  })

  // Create sample users with different roles
  const users = await prisma.user.createMany({
    data: [
      { 
        email: 'admin@timezone.com', 
        name: 'Admin User',
        role: 'admin',
        emailVerified: new Date(),
        image: 'https://avatar.vercel.sh/admin'
      },
      { 
        email: 'manager@timezone.com', 
        name: 'Manager User',
        role: 'manager',
        emailVerified: new Date(),
        image: 'https://avatar.vercel.sh/manager'
      },
      { 
        email: 'user@timezone.com', 
        name: 'Regular User',
        role: 'user',
        emailVerified: new Date(),
        image: 'https://avatar.vercel.sh/user'
      }
    ]
  })

  // Create some sample preferences
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@timezone.com' } })
  const managerUser = await prisma.user.findUnique({ where: { email: 'manager@timezone.com' } })
  const regularUser = await prisma.user.findUnique({ where: { email: 'user@timezone.com' } })

  const nyCity = await prisma.city.findFirst({ where: { name: 'New York' } })
  const londonCity = await prisma.city.findFirst({ where: { name: 'London' } })
  const tokyoCity = await prisma.city.findFirst({ where: { name: 'Tokyo' } })
  const sydneyCity = await prisma.city.findFirst({ where: { name: 'Sydney' } })

  if (adminUser && nyCity && londonCity) {
    await prisma.timeZonePreference.createMany({
      data: [
        { id: `pref-${adminUser.id}-${nyCity.id}`, userId: adminUser.id, cityId: nyCity.id },
        { id: `pref-${adminUser.id}-${londonCity.id}`, userId: adminUser.id, cityId: londonCity.id }
      ]
    })
  }

  if (managerUser && tokyoCity && sydneyCity) {
    await prisma.timeZonePreference.createMany({
      data: [
        { id: `pref-${managerUser.id}-${tokyoCity.id}`, userId: managerUser.id, cityId: tokyoCity.id },
        { id: `pref-${managerUser.id}-${sydneyCity.id}`, userId: managerUser.id, cityId: sydneyCity.id }
      ]
    })
  }

  if (regularUser && nyCity && tokyoCity) {
    await prisma.timeZonePreference.createMany({
      data: [
        { id: `pref-${regularUser.id}-${nyCity.id}`, userId: regularUser.id, cityId: nyCity.id },
        { id: `pref-${regularUser.id}-${tokyoCity.id}`, userId: regularUser.id, cityId: tokyoCity.id }
      ]
    })
  }

  console.log(`✅ Database seeded successfully!`)
  console.log(`📊 Created 31 cities`)
  console.log(`👥 Created 3 users`)
  console.log(`⚙️ Created sample preferences`)

  // Create default system settings
  const existingSettings = await prisma.systemSettings.findFirst()
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        defaultTimezone: "UTC",
        enableNotifications: true,
        enableEmailNotifications: true,
        enableRealTimeUpdates: true,
        maxCitiesPerUser: 10,
        meetingDurationMinutes: 60,
        enableAIAssistant: true,
        enableAnalytics: true,
        maintenanceMode: false,
      }
    })
    console.log(`🔧 Created default system settings`)
  }

  // Create test teams with members
  if (adminUser && managerUser && regularUser) {
    // Create Team 1: Global Time Managers (owned by admin)
    const team1 = await prisma.team.create({
      data: {
        name: 'Global Time Managers',
        description: 'A team for managing global time zone operations across multiple regions',
        ownerId: adminUser.id,
      }
    })

    // Add members to Team 1 with different roles
    await prisma.teamMember.createMany({
      data: [
        { teamId: team1.id, userId: adminUser.id, role: 'OWNER' },
        { teamId: team1.id, userId: managerUser.id, role: 'ADMIN' },
        { teamId: team1.id, userId: regularUser.id, role: 'MEMBER' }
      ]
    })

    // Create Team 2: Development Team (owned by manager)
    const team2 = await prisma.team.create({
      data: {
        name: 'Development Team',
        description: 'Development team working on timezone application features',
        ownerId: managerUser.id,
      }
    })

    // Add members to Team 2 with different roles
    await prisma.teamMember.createMany({
      data: [
        { teamId: team2.id, userId: managerUser.id, role: 'OWNER' },
        { teamId: team2.id, userId: regularUser.id, role: 'ADMIN' }
      ]
    })

    console.log(`🏢 Created 2 test teams with multiple roles`)
    console.log(`   - Team 1: "Global Time Managers" (OWNER: admin, ADMIN: manager, MEMBER: user)`)
    console.log(`   - Team 2: "Development Team" (OWNER: manager, ADMIN: user)`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })