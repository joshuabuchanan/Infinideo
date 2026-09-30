import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const userInfoVariants = cva("truncate font-medium", {
  variants: {
    size: {
      default: "text-sm",
      sm: "text-xs",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface UserInfoProps extends VariantProps<typeof userInfoVariants> {
  name?: string | null;
  className?: string;
}

export const UserInfo = ({ name, size, className }: UserInfoProps) => {
  return (
    <span className={cn(userInfoVariants({ size }), className)}>
      {name || "Unknown user"}
    </span>
  );
};
