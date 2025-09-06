import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.timeZonePreference.deleteMany()
  await prisma.city.deleteMany()
  await prisma.user.deleteMany()

  // Create cities with timezone data
  const cities = await prisma.city.createMany({
    data: [
      // North America
      { name: 'New York', country: '🇺🇸', timezone: 'America/New_York', offset: -300 },
      { name: 'Los Angeles', country: '🇺🇸', timezone: 'America/Los_Angeles', offset: -480 },
      { name: 'Chicago', country: '🇺🇸', timezone: 'America/Chicago', offset: -360 },
      { name: 'Toronto', country: '🇨🇦', timezone: 'America/Toronto', offset: -300 },
      { name: 'Vancouver', country: '🇨🇦', timezone: 'America/Vancouver', offset: -480 },
      { name: 'Mexico City', country: '🇲🇽', timezone: 'America/Mexico_City', offset: -360 },
      { name: 'São Paulo', country: '🇧🇷', timezone: 'America/Sao_Paulo', offset: -180 },

      // Europe
      { name: 'London', country: '🇬🇧', timezone: 'Europe/London', offset: 0 },
      { name: 'Paris', country: '🇫🇷', timezone: 'Europe/Paris', offset: 60 },
      { name: 'Berlin', country: '🇩🇪', timezone: 'Europe/Berlin', offset: 60 },
      { name: 'Madrid', country: '🇪🇸', timezone: 'Europe/Madrid', offset: 60 },
      { name: 'Rome', country: '🇮🇹', timezone: 'Europe/Rome', offset: 60 },
      { name: 'Amsterdam', country: '🇳🇱', timezone: 'Europe/Amsterdam', offset: 60 },
      { name: 'Stockholm', country: '🇸🇪', timezone: 'Europe/Stockholm', offset: 60 },
      { name: 'Moscow', country: '🇷🇺', timezone: 'Europe/Moscow', offset: 180 },

      // Asia
      { name: 'Dubai', country: '🇦🇪', timezone: 'Asia/Dubai', offset: 240 },
      { name: 'Tokyo', country: '🇯🇵', timezone: 'Asia/Tokyo', offset: 540 },
      { name: 'Shanghai', country: '🇨🇳', timezone: 'Asia/Shanghai', offset: 480 },
      { name: 'Hong Kong', country: '🇭🇰', timezone: 'Asia/Hong_Kong', offset: 480 },
      { name: 'Singapore', country: '🇸🇬', timezone: 'Asia/Singapore', offset: 480 },
      { name: 'Bangkok', country: '🇹🇭', timezone: 'Asia/Bangkok', offset: 420 },
      { name: 'Mumbai', country: '🇮🇳', timezone: 'Asia/Kolkata', offset: 330 },
      { name: 'Seoul', country: '🇰🇷', timezone: 'Asia/Seoul', offset: 540 },
      { name: 'Jakarta', country: '🇮🇩', timezone: 'Asia/Jakarta', offset: 420 },

      // Oceania
      { name: 'Sydney', country: '🇦🇺', timezone: 'Australia/Sydney', offset: 600 },
      { name: 'Melbourne', country: '🇦🇺', timezone: 'Australia/Melbourne', offset: 600 },
      { name: 'Auckland', country: '🇳🇿', timezone: 'Pacific/Auckland', offset: 720 },

      // Africa
      { name: 'Cairo', country: '🇪🇬', timezone: 'Africa/Cairo', offset: 120 },
      { name: 'Lagos', country: '🇳🇬', timezone: 'Africa/Lagos', offset: 60 },
      { name: 'Johannesburg', country: '🇿🇦', timezone: 'Africa/Johannesburg', offset: 120 },

      // South America
      { name: 'Buenos Aires', country: '🇦🇷', timezone: 'America/Argentina/Buenos_Aires', offset: -180 },
      { name: 'Lima', country: '🇵🇪', timezone: 'America/Lima', offset: -300 },
      { name: 'Santiago', country: '🇨🇱', timezone: 'America/Santiago', offset: -240 },

      // Middle East
      { name: 'Tel Aviv', country: '🇮🇱', timezone: 'Asia/Jerusalem', offset: 120 },
      { name: 'Riyadh', country: '🇸🇦', timezone: 'Asia/Riyadh', offset: 180 }
    ]
  })

  // Create sample users
  const users = await prisma.user.createMany({
    data: [
      { email: 'john.doe@example.com', name: 'John Doe' },
      { email: 'jane.smith@example.com', name: 'Jane Smith' },
      { email: 'alex.wong@example.com', name: 'Alex Wong' }
    ]
  })

  // Create some sample preferences
  const johnUser = await prisma.user.findUnique({ where: { email: 'john.doe@example.com' } })
  const janeUser = await prisma.user.findUnique({ where: { email: 'jane.smith@example.com' } })
  const alexUser = await prisma.user.findUnique({ where: { email: 'alex.wong@example.com' } })

  const nyCity = await prisma.city.findFirst({ where: { name: 'New York' } })
  const londonCity = await prisma.city.findFirst({ where: { name: 'London' } })
  const tokyoCity = await prisma.city.findFirst({ where: { name: 'Tokyo' } })
  const sydneyCity = await prisma.city.findFirst({ where: { name: 'Sydney' } })

  if (johnUser && nyCity && londonCity) {
    await prisma.timeZonePreference.createMany({
      data: [
        { userId: johnUser.id, cityId: nyCity.id },
        { userId: johnUser.id, cityId: londonCity.id }
      ]
    })
  }

  if (janeUser && tokyoCity && sydneyCity) {
    await prisma.timeZonePreference.createMany({
      data: [
        { userId: janeUser.id, cityId: tokyoCity.id },
        { userId: janeUser.id, cityId: sydneyCity.id }
      ]
    })
  }

  if (alexUser && nyCity && tokyoCity) {
    await prisma.timeZonePreference.createMany({
      data: [
        { userId: alexUser.id, cityId: nyCity.id },
        { userId: alexUser.id, cityId: tokyoCity.id }
      ]
    })
  }

  console.log(`✅ Database seeded successfully!`)
  console.log(`📊 Created 31 cities`)
  console.log(`👥 Created 3 users`)
  console.log(`⚙️ Created sample preferences`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })