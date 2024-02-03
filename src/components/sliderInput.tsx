import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Trans } from 'react-i18next';
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { RotateCcw, ArrowBigLeftDash, ArrowBigRightDash } from "lucide-react"
import { useEffect, useState } from "react";
import { I18nStr } from "@/i18n";

/**
 * increasing: number increases game harder
 * decreasing: number decreases game harder
 * independence: depending on game play
 */
type DifficultyType = "increasing" | "decreasing" | "independence"

function SliderInput(props: {
    id: string;
    name: string;
    value: number;
    defaultValue: number;
    minValue: number;
    maxValue: number;
    step: number;
    onValueChange: (value: number[]) => void;
    type?: string;
    disabled?: boolean;
    difficultyType?: DifficultyType;
}) {
    const {
        id,
        name,
        value,
        defaultValue,
        minValue,
        maxValue,
        step,
        onValueChange,
        type,
        disabled,
        difficultyType = 'independence'
    } = props;

    const [inputValue, setInputValue] = useState(`${value}`);

    const difficultyTypeArrowRenderer = (difficultyType: DifficultyType) => {
        switch (difficultyType) {
            case "increasing":
                return (
                    <div className="flex flex-row mt-1.5 mx-5 w-full">
                        <div className="basis-1/2 flex flex-row space-x-1">
                            <ArrowBigLeftDash color="#31A46C" size={20} />
                            <Trans i18nKey={I18nStr.easier} />
                        </div>
                        <div className="basis-1/2 flex flex-row-reverse space-x-1">
                            <ArrowBigRightDash color="#E5474D" size={20} />
                            <Trans i18nKey={I18nStr.harder} />
                        </div>
                    </div>
                )
            case "decreasing":
                return (
                    <div className="flex flex-row mt-1.5 mx-5 w-full">
                        <div className="basis-1/2 flex flex-row space-x-1">
                            <ArrowBigLeftDash color="#E5474D" size={20} />
                            <Trans i18nKey={I18nStr.harder} />
                        </div>
                        <div className="basis-1/2 flex flex-row-reverse space-x-1">
                            <ArrowBigRightDash color="#31A46C" size={20} />
                            <Trans i18nKey={I18nStr.easier} />
                        </div>
                    </div>
                )
            default:
                return null;
        }
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }

    const shownStep = type === "integer" ? 1 : 0.1;

    useEffect(() => {
        const handler = setTimeout(() => {
            // let value = +inputValue;
            // if (value < minValue) {
            //     value = minValue;
            //     setInputValue(`${minValue}`);
            // }
            // if (value > maxValue) {
            //     value = maxValue;
            //     setInputValue(`${maxValue}`);
            // }
            onValueChange([+inputValue]);
        }, 1500);
        return () => {
            clearTimeout(handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue, type, minValue, maxValue]);

    useEffect(() => {
        setInputValue(`${value}`);
    }, [value]);


    return (
        <div className="space-y-2">
            <div className="flex">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="cursor-default">
                            <Label className="leading-8 whitespace-nowrap">{name}</Label>
                            <TooltipContent>
                                <p>{id}</p>
                            </TooltipContent>
                        </TooltipTrigger>
                    </Tooltip>
                </TooltipProvider>
                {difficultyTypeArrowRenderer(difficultyType)}
                <Button variant="ghost" className="ml-auto h-8 px-1" onClick={() => {
                    onValueChange([defaultValue]);
                }} disabled={disabled}>
                    <RotateCcw />
                </Button>
            </div>
            <div className="flex">
                <TooltipProvider>
                    <Tooltip >
                        <TooltipTrigger className="mx-2 w-[15%] px-0" >
                            <Input value={inputValue} id={id} type="number" disabled={disabled} onChange={onInputChange} step={shownStep} />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{minValue} ~ {maxValue}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                {/* <Label className="px-4">{valueStr}</Label> */}
                <Slider className="max-w-[80%]" id={id} value={[value]} max={maxValue} min={minValue} step={step} onValueChange={onValueChange} disabled={disabled} />
            </div>
        </div>
    );
}

export { SliderInput };