import { prisma } from "@/lib/prisma";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/system-settings";
import SettingsPanel from "./SettingsPanel";

export const dynamic = "force-dynamic";

async function getSettings() {
  const existing = await prisma.systemSetting.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const existingKeys = new Set(existing.map((setting) => setting.key));
  const missingSettings = DEFAULT_SYSTEM_SETTINGS.filter((setting) => !existingKeys.has(setting.key));

  if (missingSettings.length > 0) {
    try {
      await prisma.$transaction(
        missingSettings.map((setting) =>
          prisma.systemSetting.create({
            data: setting,
          }),
        ),
      );
    } catch {
      // Another request may have created the same defaults first; refetch below.
    }
  }

  return prisma.systemSetting.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 pb-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configuration records loaded from the pharmacy database.</p>
        </div>
      </div>

      <SettingsPanel initialSettings={settings} />

      <div className="card p-5">
        <p className="section-title">Database Synchronization</p>
        <p className="section-sub mt-1 leading-relaxed">
          This screen reads configuration records from MongoDB and saves owner edits through the settings API.
        </p>
      </div>
    </div>
  );
}
