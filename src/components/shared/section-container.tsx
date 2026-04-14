import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva(
  "mx-auto w-full px-4 sm:px-6 lg:px-8",
  {
    variants: {
      size: {
        default: "max-w-[1400px]",
        narrow: "max-w-[1200px]",
        wide: "max-w-[1600px]",
        fluid: "max-w-none",
      },
      verticalPadding: {
        none: "py-0",
        sm: "py-4",
        md: "py-6 lg:py-8",
        lg: "py-10 lg:py-16",
        xl: "py-16 lg:py-24",
      },
    },
    defaultVariants: {
      size: "default",
      verticalPadding: "none",
    },
  }
);

interface SectionContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: React.ElementType;
}

export function SectionContainer({
  className,
  size,
  verticalPadding,
  as: Component = "div",
  ...props
}: SectionContainerProps) {
  return (
    <Component
      className={cn(containerVariants({ size, verticalPadding }), className)}
      {...props}
    />
  );
}
