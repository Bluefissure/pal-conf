import { useState } from "react"
import { useTranslation, Trans } from 'react-i18next';
import { ChevronDown } from "lucide-react"

import { CrossplayPlatformsLabels } from "@/consts/dropdownLabels"
import { DenyTechnologyList, DenyTechnologyLabels } from "@/consts/denyTechnologyList"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { I18nStr } from "@/i18n";

type Labels = typeof CrossplayPlatformsLabels | typeof DenyTechnologyLabels;
type LabelValue = Labels[number]['name'];
export type LabelValues = LabelValue[];
type Key =  'CrossplayPlatforms' | 'DenyTechnologyList';

function get<T>(dict: Record<string, T>, key: string, defaultValue: T): T {
    return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : defaultValue;
}

export function MultiSelectInput(props: {
    dKey: Key;
    selectedLabels: LabelValues;
    onLabelsChange: (labels: string[]) => void;
}) {
    const { dKey, selectedLabels, onLabelsChange } = props;
    const labels = {
      CrossplayPlatforms: CrossplayPlatformsLabels,
      DenyTechnologyList: DenyTechnologyLabels,
    }[dKey] as Labels;
    const labelNames = labels.map((label) => label.name);
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const labelDesc = dKey === 'DenyTechnologyList' 
        ? selectedLabels.map(techId => getTechnologyDisplayName(techId)).join(", ")
        : selectedLabels.join(", ");

    const onLabelCheckedChange = (label: LabelValue) => () => {
        const newLabels = selectedLabels.includes(label)
            ? selectedLabels.filter((l) => l !== label)
            : [...selectedLabels, label].sort((a, b) => labelNames.indexOf(a) - labelNames.indexOf(b));
        onLabelsChange(newLabels);
    };


    return (
        <div className="space-y-1">
            <Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="cursor-default">
                            <Trans i18nKey={get(I18nStr.entry.name, dKey, "")} />
                            <TooltipContent>
                                <p>{dKey}</p>
                            </TooltipContent>
                        </TooltipTrigger>
                    </Tooltip>
                </TooltipProvider>
            </Label>
            <div className="flex w-full items-start justify-between rounded-md border px-4 py-1 sm:flex-row sm:items-center">
                <p className="text-sm font-medium leading-none">
                    <span className="leading-7">{labelDesc}</span>
                </p>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-auto">
                            <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                    { labels.map((label) => (
                        <DropdownMenuCheckboxItem
                            key={`multi-select-${dKey}-${label.name}`}
                            checked={selectedLabels.includes(label.name)}
                            onCheckedChange={onLabelCheckedChange(label.name)}
                        >
                            {dKey === 'DenyTechnologyList' ? getTechnologyDisplayName(label.name) : t(label.name)}
                        </DropdownMenuCheckboxItem>
                    ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );

    function getTechnologyDisplayName(techId: string): string {
        const techItem = DenyTechnologyList.find(item => item.id === techId);
        return techItem ? techItem.name : techId;
    }
}
