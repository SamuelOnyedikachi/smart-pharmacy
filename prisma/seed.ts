import { PrismaClient, Role, MedicineCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SYSTEM_SETTINGS } from "../lib/system-settings";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@pharmacy.com" },
    update: {},
    create: {
      name: "Dr. Chukwuemeka Obi",
      email: "owner@pharmacy.com",
      password: hashedPassword,
      role: Role.OWNER,
      phone: "+234-801-000-0001",
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@pharmacy.com" },
    update: {},
    create: {
      name: "Ngozi Adaeze",
      email: "cashier@pharmacy.com",
      password: hashedPassword,
      role: Role.CASHIER,
      phone: "+234-801-000-0002",
    },
  });

  const stockKeeper = await prisma.user.upsert({
    where: { email: "stock@pharmacy.com" },
    update: {},
    create: {
      name: "Emeka Nwosu",
      email: "stock@pharmacy.com",
      password: hashedPassword,
      role: Role.STOCK_KEEPER,
      phone: "+234-801-000-0003",
    },
  });

  const pharmacist = await prisma.user.upsert({
    where: { email: "pharmacist@pharmacy.com" },
    update: {},
    create: {
      name: "Amaka Eze",
      email: "pharmacist@pharmacy.com",
      password: hashedPassword,
      role: Role.PHARMACIST,
      phone: "+234-801-000-0004",
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: "driver@pharmacy.com" },
    update: {},
    create: {
      name: "Tunde Bello",
      email: "driver@pharmacy.com",
      password: hashedPassword,
      role: Role.DRIVER,
      phone: "+234-801-000-0005",
    },
  });

  const qa = await prisma.user.upsert({
    where: { email: "qa@pharmacy.com" },
    update: {},
    create: {
      name: "Chidinma Okafor",
      email: "qa@pharmacy.com",
      password: hashedPassword,
      role: Role.QA_PERSONNEL,
      phone: "+234-801-000-0006",
    },
  });

  const security = await prisma.user.upsert({
    where: { email: "security@pharmacy.com" },
    update: {},
    create: {
      name: "Musa Ibrahim",
      email: "security@pharmacy.com",
      password: hashedPassword,
      role: Role.SECURITY,
      phone: "+234-801-000-0007",
    },
  });

  console.log("✅ Users created");

  // ── Addresses ──────────────────────────────────────────
  const address1 = await prisma.address.create({
    data: {
      street: "14 Aba Road",
      city: "Port Harcourt",
      state: "Rivers State",
      country: "Nigeria",
    },
  });

  const address2 = await prisma.address.create({
    data: {
      street: "7 Allen Avenue",
      city: "Lagos",
      state: "Lagos State",
      country: "Nigeria",
    },
  });

  // ── Suppliers ──────────────────────────────────────────
  const supplier1 = await prisma.supplier.create({
    data: {
      name: "MedPlus Nigeria Ltd",
      contactName: "Oluwaseun Adeyemi",
      email: "orders@medplus.ng",
      phone: "+234-802-111-1111",
      addressId: address2.id,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Fidson Healthcare Plc",
      contactName: "Bola Akinwale",
      email: "supply@fidson.com",
      phone: "+234-803-222-2222",
      addressId: address2.id,
    },
  });

  console.log("✅ Suppliers created");

  // ── Medicines ──────────────────────────────────────────
  const medicines = await Promise.all([
    prisma.medicine.create({
      data: {
        name: "Amoxicillin",
        genericName: "Amoxicillin Trihydrate",
        category: MedicineCategory.ANTIBIOTICS,
        manufacturer: "Fidson Healthcare",
        dosage: "500mg",
        form: "Capsule",
        batchNumber: "AMX-2024-001",
        expiryDate: new Date("2026-12-31"),
        stockQuantity: 240,
        reorderLevel: 50,
        unitPrice: 350,
        requiresPrescription: true,
      },
    }),
    prisma.medicine.create({
      data: {
        name: "Paracetamol",
        genericName: "Acetaminophen",
        category: MedicineCategory.ANALGESICS,
        manufacturer: "Emzor Pharmaceutical",
        dosage: "500mg",
        form: "Tablet",
        batchNumber: "PCM-2024-002",
        expiryDate: new Date("2027-06-30"),
        stockQuantity: 500,
        reorderLevel: 100,
        unitPrice: 50,
        requiresPrescription: false,
      },
    }),
    prisma.medicine.create({
      data: {
        name: "Warfarin",
        genericName: "Warfarin Sodium",
        category: MedicineCategory.CARDIOVASCULAR,
        manufacturer: "Sterling Health",
        dosage: "5mg",
        form: "Tablet",
        batchNumber: "WRF-2024-003",
        expiryDate: new Date("2025-09-30"),
        stockQuantity: 8,
        reorderLevel: 20,
        unitPrice: 1200,
        requiresPrescription: true,
      },
    }),
    prisma.medicine.create({
      data: {
        name: "Aspirin",
        genericName: "Acetylsalicylic Acid",
        category: MedicineCategory.ANALGESICS,
        manufacturer: "Bayer Nigeria",
        dosage: "100mg",
        form: "Tablet",
        batchNumber: "ASP-2024-004",
        expiryDate: new Date("2026-03-31"),
        stockQuantity: 300,
        reorderLevel: 60,
        unitPrice: 80,
        requiresPrescription: false,
      },
    }),
    prisma.medicine.create({
      data: {
        name: "Metformin",
        genericName: "Metformin Hydrochloride",
        category: MedicineCategory.ANTIDIABETICS,
        manufacturer: "Juhel Nigeria",
        dosage: "500mg",
        form: "Tablet",
        batchNumber: "MFM-2024-005",
        expiryDate: new Date("2026-08-31"),
        stockQuantity: 180,
        reorderLevel: 40,
        unitPrice: 450,
        requiresPrescription: true,
      },
    }),
    prisma.medicine.create({
      data: {
        name: "Lisinopril",
        genericName: "Lisinopril",
        category: MedicineCategory.ANTIHYPERTENSIVES,
        manufacturer: "Pfizer Nigeria",
        dosage: "10mg",
        form: "Tablet",
        batchNumber: "LSN-2024-006",
        expiryDate: new Date("2025-11-30"),
        stockQuantity: 12,
        reorderLevel: 30,
        unitPrice: 800,
        requiresPrescription: true,
      },
    }),
    prisma.medicine.create({
      data: {
        name: "Vitamin C",
        genericName: "Ascorbic Acid",
        category: MedicineCategory.VITAMINS,
        manufacturer: "Pharmatex",
        dosage: "500mg",
        form: "Tablet",
        batchNumber: "VTC-2024-007",
        expiryDate: new Date("2027-01-31"),
        stockQuantity: 600,
        reorderLevel: 100,
        unitPrice: 30,
        requiresPrescription: false,
      },
    }),
    prisma.medicine.create({
      data: {
        name: "Ciprofloxacin",
        genericName: "Ciprofloxacin Hydrochloride",
        category: MedicineCategory.ANTIBIOTICS,
        manufacturer: "May & Baker Nigeria",
        dosage: "500mg",
        form: "Tablet",
        batchNumber: "CPF-2024-008",
        expiryDate: new Date("2026-05-31"),
        stockQuantity: 150,
        reorderLevel: 30,
        unitPrice: 600,
        requiresPrescription: true,
      },
    }),
  ]);

  console.log("✅ Medicines created");

  // ── Drug Interactions ──────────────────────────────────
  const warfarin = medicines[2];
  const aspirin = medicines[3];
  const metformin = medicines[4];
  const ciprofloxacin = medicines[7];
  const amoxicillin = medicines[0];

  await prisma.drugInteraction.createMany({
    data: [
      {
        drugAId: warfarin.id,
        drugBId: aspirin.id,
        severity: "SEVERE",
        description:
          "Combining Warfarin and Aspirin significantly increases the risk of bleeding, including life-threatening hemorrhage.",
        recommendation:
          "Avoid concurrent use. If unavoidable, monitor INR closely and reduce warfarin dose.",
        source: "WHO Drug Interaction Database",
      },
      {
        drugAId: metformin.id,
        drugBId: ciprofloxacin.id,
        severity: "MODERATE",
        description:
          "Ciprofloxacin may affect blood glucose levels, potentially causing hypoglycemia in patients taking Metformin.",
        recommendation:
          "Monitor blood glucose frequently during concurrent use. Patient education required.",
        source: "FDA Drug Interaction Checker",
      },
      {
        drugAId: amoxicillin.id,
        drugBId: warfarin.id,
        severity: "MODERATE",
        description:
          "Amoxicillin may enhance the anticoagulant effect of Warfarin by altering gut flora and vitamin K synthesis.",
        recommendation: "Monitor INR closely. Adjust warfarin dose as needed.",
        source: "British National Formulary",
      },
    ],
  });

  console.log("✅ Drug interactions created");

  // ── Customers ──────────────────────────────────────────
  const customer1 = await prisma.customer.create({
    data: {
      name: "Blessing Okoro",
      phone: "+234-805-333-3333",
      email: "blessing@email.com",
      addressId: address1.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Sunday Eze",
      phone: "+234-806-444-4444",
    },
  });

  console.log("✅ Customers created");

  // ── Sample Sale ────────────────────────────────────────
  const paracetamol = medicines[1];
  const vitaminC = medicines[6];

  await prisma.sale.create({
    data: {
      cashierId: cashier.id,
      customerId: customer1.id,
      totalAmount: 380,
      amountPaid: 400,
      change: 20,
      status: "COMPLETED",
      receiptNumber: `RX-SEED-001`,
      items: {
        create: [
          {
            medicineId: paracetamol.id,
            quantity: 4,
            unitPrice: 50,
            subtotal: 200,
          },
          {
            medicineId: vitaminC.id,
            quantity: 6,
            unitPrice: 30,
            subtotal: 180,
          },
        ],
      },
    },
  });

  // ── Sample Delivery ────────────────────────────────────
  await prisma.delivery.create({
    data: {
      supplierId: supplier1.id,
      driverId: driver.id,
      status: "PENDING",
      expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: "Restock order for Q1",
      items: {
        create: [
          {
            medicineId: paracetamol.id,
            quantity: 200,
            unitCost: 35,
          },
          {
            medicineId: vitaminC.id,
            quantity: 300,
            unitCost: 22,
          },
        ],
      },
    },
  });

  console.log("✅ Sample sales and delivery created");

  // ── Quality Check ──────────────────────────────────────
  await prisma.qualityCheck.create({
    data: {
      medicineId: warfarin.id,
      inspectorId: qa.id,
      status: "PASSED",
      batchNumber: "WRF-2024-003",
      notes: "All quality parameters within acceptable range.",
    },
  });

  console.log("✅ Quality check created");

  // ── Notifications ──────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        title: "Low Stock Alert",
        message: "Warfarin (5mg) is below reorder level. Current stock: 8 units.",
        type: "LOW_STOCK",
        entityId: warfarin.id,
      },
      {
        title: "Low Stock Alert",
        message: "Lisinopril (10mg) is below reorder level. Current stock: 12 units.",
        type: "LOW_STOCK",
        entityId: medicines[5].id,
      },
      {
        title: "Expiry Warning",
        message: "Warfarin batch WRF-2024-003 expires in less than 90 days.",
        type: "EXPIRY",
        entityId: warfarin.id,
      },
      {
        title: "New Delivery Scheduled",
        message: "MedPlus Nigeria Ltd delivery expected in 3 days.",
        type: "DELIVERY",
      },
    ],
  });

  console.log("✅ Notifications created");

  await Promise.all(
    DEFAULT_SYSTEM_SETTINGS.map((setting) =>
      prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {
          title: setting.title,
          description: setting.description,
          iconKey: setting.iconKey,
          status: setting.status,
          statusTone: setting.statusTone,
          sortOrder: setting.sortOrder,
        },
        create: setting,
      }),
    ),
  );

  console.log("✅ System settings synchronized");

  console.log("\n🎉 Seed complete!\n");
  console.log("─────────────────────────────────────────");
  console.log("Login credentials (all use: password123)");
  console.log("─────────────────────────────────────────");
  console.log("Owner:       owner@pharmacy.com");
  console.log("Cashier:     cashier@pharmacy.com");
  console.log("Stock Keeper: stock@pharmacy.com");
  console.log("Pharmacist:  pharmacist@pharmacy.com");
  console.log("Driver:      driver@pharmacy.com");
  console.log("QA:          qa@pharmacy.com");
  console.log("Security:    security@pharmacy.com");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
