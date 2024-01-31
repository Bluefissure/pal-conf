import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

function TextInput(props: {
    id: string;
    name: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    type?: string;
    disabled?: boolean;
}) {
    const {
        id,
        name,
        type,
        value,
        onChange,
        disabled,
    } = props;
    return (
        <div className="flex flex-col items-center space-y-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="cursor-default mr-auto">
                        <Label>{name}</Label>
                        <TooltipContent>
                            <p>{id}</p>
                        </TooltipContent>
                    </TooltipTrigger>
                </Tooltip>
            </TooltipProvider>
            <Input className="w-[98%]" value={value} id={id} onChange={onChange} type={type} disabled={disabled} />
        </div>
    );
}

export { TextInput };