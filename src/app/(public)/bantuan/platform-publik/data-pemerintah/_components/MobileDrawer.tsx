import { HelpMobileDrawer } from "@/app/(public)/bantuan/_components/HelpNavigation";

export function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <HelpMobileDrawer
      isOpen={isOpen}
      onClose={onClose}
      currentPath="/bantuan/platform-publik/data-pemerintah"
    />
  );
}
