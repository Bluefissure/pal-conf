import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react"

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
        type
    } = props;

    let valueStr = `${value}`;
    if (type === "integer") {
        valueStr = value.toString();
    } else if (type === "float") {
        valueStr = `${+value.toFixed(1)}`;
    }
    return (
        <div className="space-y-2">
            <div className="flex">
                <Label className="leading-8" htmlFor={name}>{name}</Label>
                <Button variant="ghost" className="ml-auto h-8 px-1" onClick={() => {
                    onValueChange([defaultValue]);
                }}>
                    <RotateCcw />
                </Button>
            </div>
            <div className="flex">
                <Label className="px-4">{valueStr}</Label>
                <Slider className="max-w-[95%]" id={id} value={[value]} max={maxValue} min={minValue} step={step} onValueChange={onValueChange} />
            </div>
        </div>
    );
}

export { SliderInput };