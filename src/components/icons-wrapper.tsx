import clsx from "clsx";
import type { ReactNode } from "react";
import CommonTooltip from "./common-tooltip";
import { Button } from "./ui/button";

interface IIconWrapperProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disable?: boolean;
  tooltipContent?: string;
}

const IconWrapper = ({ children, onClick, className, disable, tooltipContent = "" }: IIconWrapperProps) => {
  return (
    <CommonTooltip content={tooltipContent} showTooltip={tooltipContent != ""}>
      <Button
        variant="ghost"
        size="icon-sm"
        className={clsx(
          `m-0 flex size-7 items-center justify-center p-0 ${className}`,
          { "cursor-not-allowed": disable }
        )}
        disabled={disable}
        onClick={onClick}

      >
        {children}
      </Button>
    </CommonTooltip>
  );
};

export default IconWrapper;
