export const DEFAULT_SYSTEM_SETTINGS = [
  {
    key: "role_access_control",
    title: "Role and Access Control",
    description:
      "Owner, stock keeper, cashier, pharmacist, driver, QA, and security modules are separated by middleware.",
    iconKey: "shield",
    status: "Configured",
    statusTone: "green",
    sortOrder: 10,
  },
  {
    key: "database_connection",
    title: "Pharmacy Database",
    description:
      "MongoDB and Prisma manage medicines, stock movement, prescriptions, sales, customers, and suppliers.",
    iconKey: "database",
    status: "Connected",
    statusTone: "green",
    sortOrder: 20,
  },
  {
    key: "alert_rules",
    title: "Alert Rules",
    description:
      "Low stock, expiry, delivery, quality, and interaction alerts are tracked through the notification module.",
    iconKey: "bell",
    status: "Enabled",
    statusTone: "green",
    sortOrder: 30,
  },
  {
    key: "federated_learning",
    title: "Federated Learning Layer",
    description:
      "Reserved for the Python FastAPI and Flower service that will train drug-safety models without sharing patient data.",
    iconKey: "brain",
    status: "Planned",
    statusTone: "amber",
    sortOrder: 40,
  },
] as const;

export const SETTING_STATUS_TONES = ["green", "amber", "red", "blue", "gray"] as const;

export type SettingStatusTone = (typeof SETTING_STATUS_TONES)[number];
