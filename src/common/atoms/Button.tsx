import React, { CSSProperties } from 'react';

import './Button.scss';

interface ButtonProps {
    className?: string;
    style?: CSSProperties;
    children: string;
    onClick: () => void;
    imageSrc?: string;
}

const Button: React.FC<ButtonProps> = ({
    className,
    style,
    onClick,
    children,
    imageSrc,
}) => {
    const btnName = `btn ${className || ''}`;
    const alt = `${className}_logo`;

    return (
        <button
            className={btnName}
            style={style}
            onClick={event => {
                event.preventDefault();
                onClick();
            }}
        >
            {imageSrc && (
                <img
                    src={process.env.PUBLIC_URL + '/assets/' + imageSrc}
                    alt={alt}
                    style={{
                        marginRight: '8px',
                        width: '20px',
                        height: '20px',
                    }}
                />
            )}
            {children}
        </button>
    );
};

export default Button;
