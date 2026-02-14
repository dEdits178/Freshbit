/**
 * Input Component
 * Reusable input field with label and validation
 */
const Input = ({
    type = 'text',
    label,
    error,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    ...props
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {LeftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LeftIcon className="h-5 w-5 text-gray-400" />
                    </div>
                )}
                <input
                    type={type}
                    className={`
            block w-full rounded-lg border
            ${LeftIcon ? 'pl-10' : 'pl-3'}
            ${RightIcon ? 'pr-10' : 'pr-3'}
            py-2
            ${error
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }
            focus:ring-2 focus:outline-none
            transition-colors
          `}
                    {...props}
                />
                {RightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <RightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default Input;
