import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function SwitchInput(props: {
    id: string;
    name: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    const {
        id,
        name,
        checked,
        onCheckedChange,
        disabled,
    } = props;
    return (
        <div className="flex">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="cursor-default leading-6">
                        <Label>{name}</Label>
                        <TooltipContent>
                            <p>{id}</p>
                        </TooltipContent>
                    </TooltipTrigger>
                </Tooltip>
            </TooltipProvider>
            <Switch className="ml-auto" checked={checked} id={id} onCheckedChange={onCheckedChange} disabled={disabled} />
        </div>
    );
}