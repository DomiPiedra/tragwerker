"use client";

import { useSearchParams } from "next/navigation";

import { SettingsView, parseSettingsSection } from "@/components/settings-view";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const section = parseSettingsSection(searchParams.get("section"));

  return <SettingsView section={section} />;
}
