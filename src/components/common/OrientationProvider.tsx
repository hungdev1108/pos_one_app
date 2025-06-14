import { useOrientationHandler } from "@/src/hooks/useOrientationHandler";
import React from "react";
import { Dimensions } from "react-native";
import OrientationModal from "./OrientationModal";

interface OrientationProviderProps {
  children: React.ReactNode;
  disabled?: boolean; // Option để disable orientation hoàn toàn
}

const OrientationProvider: React.FC<OrientationProviderProps> = ({
  children,
  disabled = false,
}) => {
  const { shouldShowModal, dismissModal, width, height } =
    useOrientationHandler();

  // Double-check: Đảm bảo modal chỉ hiển thị cho tablet thật sự
  const { width: currentWidth, height: currentHeight } =
    Dimensions.get("window");
  const isReallyTabletSize = Math.max(currentWidth, currentHeight) >= 720;
  const shouldReallyShowModal =
    !disabled && shouldShowModal && isReallyTabletSize;

  // console.log("🛡️ OrientationProvider Safeguard:", {
  //   shouldShowModal,
  //   isReallyTabletSize,
  //   shouldReallyShowModal,
  //   currentDimensions: { width: currentWidth, height: currentHeight },
  //   maxDimension: Math.max(currentWidth, currentHeight),
  // });

  return (
    <>
      {children}
      <OrientationModal
        visible={shouldReallyShowModal}
        onDismiss={dismissModal}
      />
    </>
  );
};

export default OrientationProvider;
