import '@/_modules/shared/components/Button/Button.css'
import {FC, ReactNode, MouseEventHandler} from "react";

export type ButtonProps = {
    children: ReactNode,
    className?: string,
    onClick?: MouseEventHandler<HTMLButtonElement> | undefined
    disabled?: boolean
};

const Button: FC<ButtonProps> = ({children, className, onClick, disabled = false}) => {
    return (
        <button
            className={`${className} button-color rounded-2 color-text-label text-body`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

export default Button;
