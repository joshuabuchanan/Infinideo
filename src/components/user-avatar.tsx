import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const UserAvatar = ({
  imageUrl,
  name,
  size = "default",
  className,
}: UserAvatarProps) => {
  const fallback = name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <Avatar size={size} className={cn(className)}>
      <AvatarImage src={imageUrl ?? undefined} alt={name ?? "User avatar"} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};