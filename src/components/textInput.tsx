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
    description?: string;
}) {
    const {
        id,
        name,
        type,
        value,
        onChange,
        disabled,
        multiline,
        description,
    } = props;
    const inputElement = multiline ? (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            className="min-h-[110px] w-full rounded-xl border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
            disabled={disabled}
        />
    ): (
        <Input
            value={value}
            id={id}
            onChange={onChange}
            type={type}
            className="w-full"
            disabled={disabled}
        />
    )
    return (
        <div className="flex flex-col items-stretch space-y-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="cursor-default mr-auto">
                        <Label>{name}</Label>
                        <TooltipContent className="max-w-sm">
                            <p className="font-mono text-xs text-muted-foreground">{id}</p>
                            {description && <p className="mt-1 whitespace-pre-line leading-relaxed">{description}</p>}
                        </TooltipContent>
                    </TooltipTrigger>
                </Tooltip>
            </TooltipProvider>
            {inputElement}            
        </div>
    );
}

export { TextInput };