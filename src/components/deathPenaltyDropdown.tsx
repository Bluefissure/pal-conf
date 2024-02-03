import { useState } from "react"
import { useTranslation, Trans } from 'react-i18next';
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { I18nStr } from "@/i18n";

const labels = [
    {
        name: "None",
        desc: "No lost",
    },
    {
        name: "Item",
        desc: "Lost item without equipment",
    },
    {
        name: "ItemAndEquipment",
        desc: "Lost item and equipment",
    },
    {
        name: "All",
        desc: "Lost All item, equipment, pal(in inventory)",
    },
]

export const DeathPenaltyDropDown = (props: {
    label: string,
    onLabelChange: (label: string) => void,
}) => {
    const { t } = useTranslation();

    const { label, onLabelChange } = props;
    const [open, setOpen] = useState(false)

    const labelDesc = t(`${I18nStr.entry.name.DeathPenalty}.${label}`, {
        defaultValue: labels.find((l) => l.name === label)?.desc ?? "",
    });

    return (
        <div className="space-y-1">
            <Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="cursor-default">
                            <Trans i18nKey={I18nStr.entry.name.DeathPenalty} />
                            <TooltipContent>
                                <p>DeathPenalty</p>
                            </TooltipContent>
                        </TooltipTrigger>
                    </Tooltip>
                </TooltipProvider>
            </Label>
            <div className="flex w-full items-start justify-between rounded-md border px-4 py-1 sm:flex-row sm:items-center">
                <p className="text-sm font-medium leading-none">
                    <span className="mr-2 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground normal-case">
                        {label}
                    </span>
                    <span className="text-muted-foreground leading-7">{labelDesc}</span>
                </p>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-auto">
                            <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuGroup>
                            <Command>
                                <CommandList>
                                    <CommandEmpty>No label found.</CommandEmpty>
                                    <CommandGroup>
                                        {labels.map((label) => (
                                            <CommandItem
                                                key={label.name}
                                                value={label.name}
                                                onSelect={() => {
                                                    setOpen(false);
                                                    onLabelChange(label.name);
                                                }}
                                            >
                                                {label.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
