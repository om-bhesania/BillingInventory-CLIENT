import React from "react";
import { useApiActivity } from "@/contexts/ApiActivityContext";

export const TopLoader: React.FC = () => {
  const { isLoading } = useApiActivity();

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: "none",
        background:
          "linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,1) 50%, rgba(59,130,246,0) 100%)",
        transform: isLoading ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 300ms ease",
      }}
    />
  );
};


