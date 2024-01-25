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
        <div className="flex flex-col items-center space-y-2">
            <Label className="mr-auto" htmlFor={name}>{name}</Label>
            <Input className="w-[98%]" value={value} id={id} onChange={onChange} type={type} />
        </div>
    );
}

export { TextInput };