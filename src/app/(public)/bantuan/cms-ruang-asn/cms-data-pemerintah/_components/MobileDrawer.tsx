import { HelpMobileDrawer } from "@/app/(public)/bantuan/_components/HelpNavigation";

export function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <HelpMobileDrawer
      isOpen={isOpen}
      onClose={onClose}
      currentPath="/bantuan/cms-ruang-asn/cms-data-pemerintah"
    />
  );
}
