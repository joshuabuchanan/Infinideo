"use client";

import { BellIcon, BellOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSubscribed: boolean;
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  className?: string;
}

export const SubscriptionButton = ({
  onClick,
  disabled,
  isSubscribed,
  size = "default",
  className,
}: SubscriptionButtonProps) => {
  return (
    <Button
      type="button"
      size={size}
      variant={isSubscribed ? "secondary" : "default"}
      onClick={onClick}
      disabled={disabled}
      className={cn("rounded-full", className)}
    >
      {isSubscribed ? <BellOffIcon /> : <BellIcon />}
      {isSubscribed ? "Subscribed" : "Subscribe"}
    </Button>
  );
};