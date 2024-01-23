import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

function TextInput(props: {
    id: string;
    name: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    type?: string;
}) {
    const {
        id,
        name,
        type,
        value,
        onChange,
    } = props;
    return (
        <div className="space-y-2">
            <Label htmlFor={name}>{name}</Label>
            <Input value={value} id={id} onChange={onChange} type={type} />
        </div>
    );
}

export { TextInput };