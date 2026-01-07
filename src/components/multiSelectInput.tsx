import { useState } from "react"
import { useTranslation, Trans } from 'react-i18next';
import { ChevronDown } from "lucide-react"

import { CrossplayPlatformsLabels } from "@/consts/dropdownLabels"
import { DenyTechnologyLabels } from "@/consts/denyTechnologyList"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command"
import { I18nStr } from "@/i18n";
import { cn } from "@/lib/utils";

type Labels = typeof CrossplayPlatformsLabels | typeof DenyTechnologyLabels;
type LabelValue = Labels[number]['name'];
export type LabelValues = LabelValue[];
type Key =  'CrossplayPlatforms' | 'DenyTechnologyList';

// 为不同类型的label添加类型定义
interface LabelWithId {
  id: string;
  name: string;
}

interface LabelWithNameOnly {
  name: string;
}

type LabelItem = LabelWithId | LabelWithNameOnly;

// 辅助函数：安全获取label的id
function getLabelId(label: LabelItem): string {
  if ('id' in label) {
    return (label as LabelWithId).id;
  }
  return label.name; // 对于CrossplayPlatforms，使用name作为id
}

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
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    // 将外部传入的ID转换为内部显示的中文名称
    const internalSelectedLabels = dKey === 'DenyTechnologyList' 
        ? selectedLabels.map(id => {
            const techItem = labels.find(label => getLabelId(label) === id);
            return techItem ? techItem.name : id;
          })
        : selectedLabels;

    const labelDesc = dKey === 'DenyTechnologyList' 
        ? internalSelectedLabels.join(", ")
        : selectedLabels.join(", ");

    const onLabelCheckedChange = (label: LabelValue) => () => {
        const newInternalLabels = internalSelectedLabels.includes(label)
            ? internalSelectedLabels.filter((l) => l !== label)
            : [...internalSelectedLabels, label].sort();

        // 将内部的中文名称转换回ID传递给外部
        const externalLabels = dKey === 'DenyTechnologyList'
            ? newInternalLabels.map(name => {
                const techItem = labels.find(label => label.name === name);
                return techItem ? getLabelId(techItem) : name;
              })
            : newInternalLabels;

        onLabelsChange(externalLabels);
    };

    const filteredLabels = labels.filter((label) => {
        const displayName = dKey === 'DenyTechnologyList' 
            ? label.name // 直接使用中文名称
            : t(label.name);
        const searchLower = searchValue.toLowerCase();
        const labelId = getLabelId(label);
        return displayName.toLowerCase().includes(searchLower) || 
               labelId.toLowerCase().includes(searchLower); // 同时搜索ID和名称
    });


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
                    <DropdownMenuContent className="w-56 p-0">
                        <Command>
                            <CommandInput 
                                placeholder={dKey === 'DenyTechnologyList' ? "搜索科技名称或ID..." : "搜索..."} 
                                value={searchValue}
                                onValueChange={setSearchValue}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {dKey === 'DenyTechnologyList' ? "未找到匹配的科技" : "未找到匹配项"}
                                </CommandEmpty>
                                <CommandGroup>
                                    {filteredLabels.map((label) => (
                                        <CommandItem
                                            key={`multi-select-${dKey}-${label.name}`}
                                            value={`${getLabelId(label)} ${label.name}`}
                                            onSelect={() => onLabelCheckedChange(label.name)()}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className={cn(
                                                    "w-4 h-4 border rounded",
                                                    internalSelectedLabels.includes(label.name) && "bg-primary"
                                                )}>
                                                    {internalSelectedLabels.includes(label.name) && (
                                                        <span className="text-white text-xs">✓</span>
                                                    )}
                                                </div>
                                                <span>{dKey === 'DenyTechnologyList' ? label.name : t(label.name)}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );

}
