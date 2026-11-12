import type { ReactNode } from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@radix-ui/react-tooltip'

interface TooltipTrigger {
    children: ReactNode
    content: string
    showTooltip?: boolean
}
function CommonTooltip({ children, content, showTooltip = true }: TooltipTrigger) {
    return (
        <div className='z-50'>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {children}
                    </TooltipTrigger>

                    {showTooltip &&
                        <TooltipContent side={'bottom'}>
                            <div className="border bg-secondary rounded-md p-3 text-sm ">
                                {/* Not a heading: an h1 here would put Bricolage
                                    Grotesque at 14px, and the display face never
                                    goes below h3. Geist at 600 instead. */}
                                <p className="font-semibold text-sm text-foreground"> {content}</p>
                            </div>
                        </TooltipContent>
                    }
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

export default CommonTooltip

