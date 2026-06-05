"use client";

import type { ReactNode } from "react";
import { Settings } from "lucide-react";

import {
  ContentFullViewPanel,
  ContentFullViewPanelTrigger,
} from "@/components/content-full-view-panel";

type ContentFullViewSettingsMenuProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerClick: () => void;
  triggerActive?: boolean;
  className?: string;
};

export function ContentFullViewSettingsMenu({
  children,
  open,
  onOpenChange,
  onTriggerClick,
  triggerActive = false,
  className,
}: ContentFullViewSettingsMenuProps) {
  return (
    <div className={className}>
      <ContentFullViewPanelTrigger
        icon={Settings}
        label="Site Settings"
        active={triggerActive}
        onClick={onTriggerClick}
      />
      <ContentFullViewPanel
        open={open}
        onOpenChange={onOpenChange}
        title="Site Settings"
        subtitle="Publishing and visibility for this page."
      >
        <div className="space-y-4">{children}</div>
      </ContentFullViewPanel>
    </div>
  );
}
