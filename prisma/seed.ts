import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding...");

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.lockedMonth.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  console.log("  - Cleared old data");

  // Create Users
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const arun = await prisma.user.create({
    data: {
      name: "Arun Kumar",
      email: "arun@example.com",
      passwordHash,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arun",
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "rahul@example.com",
      passwordHash,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
    },
  });

  const karthik = await prisma.user.create({
    data: {
      name: "Karthik Raj",
      email: "karthik@example.com",
      passwordHash,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik",
    },
  });

  const vijay = await prisma.user.create({
    data: {
      name: "Vijay Sethu",
      email: "vijay@example.com",
      passwordHash,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay",
    },
  });

  console.log("  - Created 4 seed users (arun@example.com / Password123!)");

  // Create Primary Group: "Chennai Bachelor Room"
  const group = await prisma.group.create({
    data: {
      name: "Chennai Bachelor Room",
      description: "Shared 3BHK Apartment Expenses in T. Nagar, Chennai",
      createdBy: arun.id,
      currency: "INR",
      members: {
        create: [
          { userId: arun.id, role: "ADMIN", status: "ACTIVE" },
          { userId: rahul.id, role: "MEMBER", status: "ACTIVE" },
          { userId: karthik.id, role: "MEMBER", status: "ACTIVE" },
          { userId: vijay.id, role: "MEMBER", status: "ACTIVE" },
        ],
      },
    },
  });

  // Secondary Group for multi-group testing: "Goa Trip"
  const goaGroup = await prisma.group.create({
    data: {
      name: "Goa Trip 2026",
      description: "Weekend Bachelor Trip to Goa",
      createdBy: rahul.id,
      currency: "INR",
      members: {
        create: [
          { userId: rahul.id, role: "ADMIN", status: "ACTIVE" },
          { userId: arun.id, role: "MEMBER", status: "ACTIVE" },
        ],
      },
    },
  });

  console.log("  - Created groups: 'Chennai Bachelor Room' & 'Goa Trip 2026'");

  // Default Categories
  const categoryData = [
    { name: "Food", icon: "Utensils", description: "Dining out, swiggy, zomato" },
    { name: "Groceries", icon: "ShoppingCart", description: "Vegetables, milk, snacks" },
    { name: "Rent", icon: "Home", description: "Monthly flat rent" },
    { name: "Electricity", icon: "Zap", description: "EB Bill" },
    { name: "Water", icon: "Droplets", description: "Drinking water cans" },
    { name: "Internet", icon: "Wifi", description: "Fiber Broadband bill" },
    { name: "Travel", icon: "Car", description: "Cabs, fuel, auto" },
    { name: "Fuel", icon: "Fuel", description: "Bike fuel" },
    { name: "Entertainment", icon: "Film", description: "Movies, gaming, sports" },
    { name: "Household", icon: "Package", description: "Utensils, towels, furniture" },
    { name: "Cleaning", icon: "Sparkles", description: "Maid salary, detergent, soaps" },
    { name: "Medical", icon: "Stethoscope", description: "Medicines & doctor" },
    { name: "Shopping", icon: "ShoppingBag", description: "Shared items" },
    { name: "Subscriptions", icon: "Tv", description: "Netflix, Prime, Spotify" },
    { name: "Maintenance", icon: "Wrench", description: "Plumbing, AC service" },
    { name: "Education", icon: "GraduationCap", description: "Books & courses" },
    { name: "Other", icon: "MoreHorizontal", description: "Miscellaneous expenses" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.create({
      data: {
        groupId: group.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
      },
    });
    categories[cat.name] = created.id;
  }

  // Create Categories for Goa Trip
  const goaFood = await prisma.category.create({
    data: { groupId: goaGroup.id, name: "Food", icon: "Utensils" },
  });

  console.log("  - Created default categories for groups");

  // Sample Expenses
  // 1. Rent: ₹24,000 paid by Arun equal split (₹6,000 = 600000 paise each)
  await prisma.expense.create({
    data: {
      groupId: group.id,
      paidById: arun.id,
      categoryId: categories["Rent"],
      amount: 2400000, // ₹24,000
      description: "August Flat Rent",
      expenseDate: new Date("2026-08-01"),
      splitMethod: "EQUAL",
      notes: "Transferred to landlord directly via UPI",
      splits: {
        create: [
          { userId: arun.id, amount: 600000 },
          { userId: rahul.id, amount: 600000 },
          { userId: karthik.id, amount: 600000 },
          { userId: vijay.id, amount: 600000 },
        ],
      },
    },
  });

  // 2. Groceries: ₹4,800 paid by Rahul equal split (₹1,200 = 120000 paise each)
  await prisma.expense.create({
    data: {
      groupId: group.id,
      paidById: rahul.id,
      categoryId: categories["Groceries"],
      amount: 480000, // ₹4,800
      description: "Monthly Supermarket Groceries & Vegetables",
      expenseDate: new Date("2026-08-05"),
      splitMethod: "EQUAL",
      splits: {
        create: [
          { userId: arun.id, amount: 120000 },
          { userId: rahul.id, amount: 120000 },
          { userId: karthik.id, amount: 120000 },
          { userId: vijay.id, amount: 120000 },
        ],
      },
    },
  });

  // 3. Internet & OTT: ₹1,500 paid by Karthik - Exact split (Karthik ₹500, Arun ₹500, Rahul ₹500)
  await prisma.expense.create({
    data: {
      groupId: group.id,
      paidById: karthik.id,
      categoryId: categories["Internet"],
      amount: 150000, // ₹1,500
      description: "Airtel Fiber Broadband Bill",
      expenseDate: new Date("2026-08-10"),
      splitMethod: "EXACT",
      splits: {
        create: [
          { userId: arun.id, amount: 50000 },
          { userId: rahul.id, amount: 50000 },
          { userId: karthik.id, amount: 50000 },
        ],
      },
    },
  });

  // 4. Maid & Cleaning: ₹3,000 paid by Vijay - Shares split (Arun 2 shares, Rahul 1 share, Karthik 1 share, Vijay 2 shares)
  await prisma.expense.create({
    data: {
      groupId: group.id,
      paidById: vijay.id,
      categoryId: categories["Cleaning"],
      amount: 300000, // ₹3,000
      description: "Maid Salary & Floor Cleaners",
      expenseDate: new Date("2026-08-12"),
      splitMethod: "SHARES",
      splits: {
        create: [
          { userId: arun.id, amount: 100000, shares: 2 },
          { userId: rahul.id, amount: 50000, shares: 1 },
          { userId: karthik.id, amount: 50000, shares: 1 },
          { userId: vijay.id, amount: 100000, shares: 2 },
        ],
      },
    },
  });

  // 5. Weekend Party Dinner: ₹6,000 paid by Arun - Percentage split (Arun 40%, Rahul 20%, Karthik 20%, Vijay 20%)
  await prisma.expense.create({
    data: {
      groupId: group.id,
      paidById: arun.id,
      categoryId: categories["Food"],
      amount: 600000, // ₹6,000
      description: "Barbeque Nation Dinner",
      expenseDate: new Date("2026-08-15"),
      splitMethod: "PERCENTAGE",
      splits: {
        create: [
          { userId: arun.id, amount: 240000, percentage: 40 },
          { userId: rahul.id, amount: 120000, percentage: 20 },
          { userId: karthik.id, amount: 120000, percentage: 20 },
          { userId: vijay.id, amount: 120000, percentage: 20 },
        ],
      },
    },
  });

  console.log("  - Added realistic expenses with 4 split methods");

  // Sample Settlement: Rahul transferred ₹4,000 to Arun via UPI
  await prisma.settlement.create({
    data: {
      groupId: group.id,
      fromUserId: rahul.id,
      toUserId: arun.id,
      amount: 400000, // ₹4,000
      paymentMethod: "UPI",
      status: "CONFIRMED",
      note: "Partial rent settlement for August",
      settledAt: new Date("2026-08-16"),
    },
  });

  console.log("  - Added confirmed settlement");

  // Sample Budgets for August 2026
  await prisma.budget.createMany({
    data: [
      { groupId: group.id, categoryId: categories["Food"], month: 8, year: 2026, amount: 1500000 }, // ₹15,000
      { groupId: group.id, categoryId: categories["Groceries"], month: 8, year: 2026, amount: 1000000 }, // ₹10,000
      { groupId: group.id, categoryId: categories["Rent"], month: 8, year: 2026, amount: 2500000 }, // ₹25,000
      { groupId: group.id, categoryId: categories["Internet"], month: 8, year: 2026, amount: 200000 }, // ₹2,000
    ],
  });

  console.log("  - Added category budgets");

  // Sample Recurring Expense
  await prisma.recurringExpense.create({
    data: {
      groupId: group.id,
      createdById: arun.id,
      categoryId: categories["Internet"],
      description: "Monthly Fiber Broadband Bill",
      amount: 150000,
      frequency: "MONTHLY",
      nextDueDate: new Date("2026-09-10"),
      active: true,
    },
  });

  // Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: arun.id,
        groupId: group.id,
        title: "Settlement Received",
        message: "Rahul शर्मा settled ₹4,000 via UPI.",
        type: "SETTLEMENT_REQUEST",
        read: true,
      },
      {
        userId: rahul.id,
        groupId: group.id,
        title: "New Expense Added",
        message: "Arun added ₹6,000 for Barbeque Nation Dinner.",
        type: "EXPENSE_ADDED",
        read: false,
      },
    ],
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        groupId: group.id,
        userId: arun.id,
        action: "EXPENSE_CREATE",
        entityType: "Expense",
        entityId: "seed-expense-1",
        metadata: JSON.stringify({ amount: 24000, description: "August Flat Rent" }),
      },
      {
        groupId: group.id,
        userId: rahul.id,
        action: "SETTLEMENT_CREATE",
        entityType: "Settlement",
        entityId: "seed-settlement-1",
        metadata: JSON.stringify({ amount: 4000, toUser: "Arun Kumar" }),
      },
    ],
  });

  console.log("✅ DB SEEDING COMPLETED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
