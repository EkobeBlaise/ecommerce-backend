import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================
// DATA: Categories, Groups, and Sub-Categories
// ============================================================

const categoryData = [
  { name: 'Women', slug: 'women', gender: 'women', displayOrder: 1 },
  { name: 'Men', slug: 'men', gender: 'men', displayOrder: 2 },
  { name: 'Kids', slug: 'kids', gender: 'kids', displayOrder: 3 },
];

// Groups for each category
const groupData = {
  women: [
    { name: 'NEW IN', slug: 'new-in-women', displayOrder: 1 },
    { name: 'Clothing', slug: 'clothing-women', displayOrder: 2 },
    { name: 'Shoes', slug: 'shoes-women', displayOrder: 3 },
    { name: 'Accessories', slug: 'accessories-women', displayOrder: 4 },
    { name: 'Designer', slug: 'designer-women', displayOrder: 5 },
    { name: 'Streetwear', slug: 'streetwear-women', displayOrder: 6 },
    { name: 'Sports', slug: 'sports-women', displayOrder: 7 },
    { name: 'Brands', slug: 'brands-women', displayOrder: 8 },
    { name: 'Sale', slug: 'sale-women', displayOrder: 9 },
  ],
  men: [
    { name: 'NEW IN', slug: 'new-in-men', displayOrder: 1 },
    { name: 'Clothing', slug: 'clothing-men', displayOrder: 2 },
    { name: 'Shoes', slug: 'shoes-men', displayOrder: 3 },
    { name: 'Accessories', slug: 'accessories-men', displayOrder: 4 },
    { name: 'Designer', slug: 'designer-men', displayOrder: 5 },
    { name: 'Streetwear', slug: 'streetwear-men', displayOrder: 6 },
    { name: 'Sports', slug: 'sports-men', displayOrder: 7 },
    { name: 'Brands', slug: 'brands-men', displayOrder: 8 },
    { name: 'Sale', slug: 'sale-men', displayOrder: 9 },
  ],
  kids: [
    { name: 'NEW IN', slug: 'new-in-kids', displayOrder: 1 },
    { name: 'Girls', slug: 'girls-kids', displayOrder: 2 },
    { name: 'Boys', slug: 'boys-kids', displayOrder: 3 },
    { name: 'Baby', slug: 'baby-kids', displayOrder: 4 },
    { name: 'Shoes', slug: 'shoes-kids', displayOrder: 5 },
    { name: 'Accessories', slug: 'accessories-kids', displayOrder: 6 },
    { name: 'Designer', slug: 'designer-kids', displayOrder: 7 },
    { name: 'Sports', slug: 'sports-kids', displayOrder: 8 },
    { name: 'Brands', slug: 'brands-kids', displayOrder: 9 },
    { name: 'Sale', slug: 'sale-kids', displayOrder: 10 },
  ],
};

// Sub-categories for each group
const subData = {
  // Women - Clothing
  'clothing-women': [
    { name: 'Dresses', slug: 'dresses-women' },
    { name: 'Shirts & Blouses', slug: 'shirts-blouses-women' },
    { name: 'Trench coats', slug: 'trench-coats-women' },
    { name: 'Skirts', slug: 'skirts-women' },
    { name: 'Hoodies & Sweatshirts', slug: 'hoodies-sweatshirts-women' },
    { name: 'All clothing', slug: 'all-clothing-women' },
    { name: 'T-shirts & Tops', slug: 't-shirts-tops-women' },
    { name: 'Trousers', slug: 'trousers-women' },
    { name: 'Jackets', slug: 'jackets-women' },
    { name: 'Jeans', slug: 'jeans-women' },
  ],
  'shoes-women': [
    { name: 'Ballerinas', slug: 'ballerinas-women' },
    { name: 'Sneakers', slug: 'sneakers-women' },
    { name: 'Loafers', slug: 'loafers-women' },
    { name: 'Boots', slug: 'boots-women' },
    { name: 'Hiking shoes', slug: 'hiking-shoes-women' },
    { name: 'Slippers', slug: 'slippers-women' },
    { name: 'Flats', slug: 'flats-women' },
    { name: 'Heels', slug: 'heels-women' },
    { name: 'Mules', slug: 'mules-women' },
    { name: 'Sports Shoes', slug: 'sports-shoes-women' },
  ],
  'accessories-women': [
    { name: 'Sunglasses', slug: 'sunglasses-women' },
    { name: 'Jewellery', slug: 'jewellery-women' },
    { name: 'Hats', slug: 'hats-women' },
    { name: 'Handbags', slug: 'handbags-women' },
    { name: 'Watches', slug: 'watches-women' },
    { name: 'Backpacks', slug: 'backpacks-women' },
    { name: 'Wallets', slug: 'wallets-women' },
    { name: 'Belts', slug: 'belts-women' },
    { name: 'Scarves', slug: 'scarves-women' },
  ],
  // Men - Clothing
  'clothing-men': [
    { name: 'T-Shirts', slug: 't-shirts-men' },
    { name: 'Polos', slug: 'polos-men' },
    { name: 'Linen Shirts', slug: 'linen-shirts-men' },
    { name: 'Shorts', slug: 'shorts-men' },
    { name: 'Lightweight Jackets', slug: 'lightweight-jackets-men' },
    { name: 'All clothing', slug: 'all-clothing-men' },
    { name: 'Dress Shirts', slug: 'dress-shirts-men' },
    { name: 'Chinos', slug: 'chinos-men' },
    { name: 'Blazers', slug: 'blazers-men' },
    { name: 'Jeans', slug: 'jeans-men' },
  ],
  'shoes-men': [
    { name: 'Sneakers', slug: 'sneakers-men' },
    { name: 'Loafers', slug: 'loafers-men' },
    { name: 'Espadrilles', slug: 'espadrilles-men' },
    { name: 'Sandals', slug: 'sandals-men' },
    { name: 'Slip-ons', slug: 'slip-ons-men' },
    { name: 'Canvas Shoes', slug: 'canvas-shoes-men' },
    { name: 'Formal Shoes', slug: 'formal-shoes-men' },
    { name: 'Boots', slug: 'boots-men' },
    { name: 'Sports Shoes', slug: 'sports-shoes-men' },
  ],
  'accessories-men': [
    { name: 'Sunglasses', slug: 'sunglasses-men' },
    { name: 'Watches', slug: 'watches-men' },
    { name: 'Hats', slug: 'hats-men' },
    { name: 'Bags', slug: 'bags-men' },
    { name: 'Backpacks', slug: 'backpacks-men' },
    { name: 'Wallets', slug: 'wallets-men' },
    { name: 'Belts', slug: 'belts-men' },
    { name: 'Ties', slug: 'ties-men' },
    { name: 'Scarves', slug: 'scarves-men' },
  ],
  // Kids - Girls
  'girls-kids': [
    { name: 'Dresses', slug: 'dresses-girls' },
    { name: 'T-shirts & Tops', slug: 't-shirts-tops-girls' },
    { name: 'Jackets', slug: 'jackets-girls' },
    { name: 'Trousers', slug: 'trousers-girls' },
    { name: 'Jeans', slug: 'jeans-girls' },
    { name: 'Sweatshirts & Knitwear', slug: 'sweatshirts-knitwear-girls' },
  ],
  'boys-kids': [
    { name: 'T-shirts & Tops', slug: 't-shirts-tops-boys' },
    { name: 'Jeans', slug: 'jeans-boys' },
    { name: 'Jackets & Vests', slug: 'jackets-vests-boys' },
    { name: 'Sweatshirts & Knitwear', slug: 'sweatshirts-knitwear-boys' },
    { name: 'Trousers', slug: 'trousers-boys' },
    { name: 'Shirts', slug: 'shirts-boys' },
  ],
  'shoes-kids': [
    { name: 'Sneakers', slug: 'sneakers-kids' },
    { name: 'Boots', slug: 'boots-kids' },
    { name: 'Slippers', slug: 'slippers-kids' },
    { name: 'Sports Shoes', slug: 'sports-shoes-kids' },
  ],
};

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function main() {
  console.log('🌱 Seeding database...');

  // --- 1. Seed Categories ---
  console.log('📦 Seeding categories...');
  const categoryMap = {};
  for (const cat of categoryData) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = result;
    console.log(`✅ Created category: ${cat.name}`);
  }

  // --- 2. Seed Groups ---
  console.log('📦 Seeding category groups...');
  const groupMap = {};
  for (const [gender, groups] of Object.entries(groupData)) {
    const category = categoryMap[gender];
    if (!category) continue;

    for (const group of groups) {
      const result = await prisma.categoryGroup.upsert({
        where: { slug: group.slug },
        update: {},
        create: {
          name: group.name,
          slug: group.slug,
          categoryId: category.id,
          displayOrder: group.displayOrder || 0,
          isActive: true,
        },
      });
      groupMap[group.slug] = result;
      console.log(`✅ Created group: ${group.name} (${gender})`);
    }
  }

  // --- 3. Seed Sub-Categories ---
  console.log('📦 Seeding sub-categories...');
  let subCount = 0;
  for (const [groupSlug, subs] of Object.entries(subData)) {
    const group = groupMap[groupSlug];
    if (!group) {
      console.log(`⚠️ Group not found: ${groupSlug}`);
      continue;
    }

    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      await prisma.subCategory.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          name: sub.name,
          slug: sub.slug,
          categoryGroupId: group.id,
          categoryId: group.categoryId,
          displayOrder: i + 1,
          isActive: true,
        },
      });
      subCount++;
    }
    console.log(`✅ Created ${subs.length} sub-categories for ${groupSlug}`);
  }
  console.log(`✅ Total sub-categories created: ${subCount}`);

  // --- 4. Seed Admin User ---
  console.log('👤 Seeding admin user...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Admin123!', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Store',
      role: 'admin',
      isVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (password: Admin123!)`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());