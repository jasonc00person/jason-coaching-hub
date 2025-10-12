import type { FC } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const TooltipIconButton: FC<
  ButtonProps & {
    tooltip: string;
    side?: "top" | "bottom" | "left" | "right";
  }
> = ({ children, tooltip, side = "bottom", ...rest }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" {...rest}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

