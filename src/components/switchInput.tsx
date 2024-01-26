import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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
            <Label htmlFor={name} className="leading-6">{name}</Label>
            <Switch className="ml-auto" checked={checked} id={id} onCheckedChange={onCheckedChange} disabled={disabled}/>
        </div>
    );
}