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
    onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    type?: string;
    disabled?: boolean;
    multiline?: boolean;
}) {
    const {
        id,
        name,
        type,
        value,
        onChange,
        disabled,
        multiline,
    } = props;
    const inputElement = multiline ? (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            className="w-[98%] h-[100px] p-2 border border-gray-300 rounded-md"
            disabled={disabled}
        />
    ): (
        <Input
            value={value}
            id={id}
            onChange={onChange}
            type={type}
            className="w-[98%]"
            disabled={disabled}
        />
    )
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
            {inputElement}            
        </div>
    );
}

export { TextInput };