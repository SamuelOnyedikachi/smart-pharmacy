import { PrismaClient } from "@prisma/client";
import { DEFAULT_SYSTEM_SETTINGS } from "../lib/system-settings";

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
