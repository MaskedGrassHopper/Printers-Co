import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@printer-co.com',
      name: 'Admin User',
      password: 'hashed_password_here', // In production, this should be properly hashed
      role: 'ADMIN',
      isActive: true
    }
  })

  // Create test categories
  const printers = await prisma.category.create({
    data: {
      name: 'Printers',
      slug: 'printers',
      description: 'All types of printers'
    }
  })

  const supplies = await prisma.category.create({
    data: {
      name: 'Supplies',
      slug: 'supplies',
      description: 'Printer supplies and accessories'
    }
  })

  // Create test products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'HP LaserJet Pro',
        slug: 'hp-laserjet-pro',
        description: 'Professional grade laser printer',
        price: 299.99,
        stock: 50,
        isPublished: true,
        specifications: {
          ppm: 27,
          dpi: '1200x1200',
          wireless: true
        },
        categories: {
          connect: { id: printers.id }
        },
        createdBy: {
          connect: { id: admin.id }
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Canon PIXMA',
        slug: 'canon-pixma',
        description: 'Color inkjet printer for home use',
        price: 129.99,
        stock: 75,
        isPublished: true,
        specifications: {
          ppm: 15,
          dpi: '4800x1200',
          wireless: true
        },
        categories: {
          connect: { id: printers.id }
        },
        createdBy: {
          connect: { id: admin.id }
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'HP Toner Cartridge',
        slug: 'hp-toner-cartridge',
        description: 'Original HP toner cartridge',
        price: 79.99,
        stock: 100,
        isPublished: true,
        specifications: {
          yield: '2500 pages',
          compatibility: ['HP LaserJet Pro']
        },
        categories: {
          connect: { id: supplies.id }
        },
        createdBy: {
          connect: { id: admin.id }
        }
      }
    })
  ])

  console.log('Seed data created:', {
    admin,
    categories: [printers, supplies],
    products
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 