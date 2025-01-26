import '@/_modules/shared/components/Input/TextInput.css'
import React, {useRef, useState} from "react";

type ValidationRule = (value: string) => boolean | string;

type TextInputProps = {
    name: string;
    placeholder: string;
    rules?: ValidationRule[]
    onValidationChange?: (name: string, isValid: boolean) => void;
}

const TextInput: React.FC<TextInputProps> = (
    {
        name, rules, onValidationChange, placeholder
    }) => {
    const inputRef = useRef(null);
    const [error, setError] = useState<string | null>(null);

    const validate = (value: string): void => {
        if (!rules) {
            onValidationChange?.(name, true);
            return;
        }

        for (const rule of rules) {
            const result = rule(value);
            if (typeof result === 'string') {
                setError(result);
                onValidationChange?.(name, false);
                return;
            }
        }
        setError(null);
        onValidationChange?.(name, true);
        return;
    };


    const handleBlur = () => {
        validate(inputRef.current?.value);
    };

    return (
        <div className={'text-input flex flex-col gap-1 w-full'}>
            <input ref={inputRef} className={'text-input__input text-body color-text-app'} id={name} name={name}
                   placeholder={placeholder} onBlur={handleBlur}/>
            <div className={'text-input__divider'}></div>
            <div className={'text-input__error color-text-app-error text-label'}>{error}</div>
        </div>
    );
}

export default TextInput;
