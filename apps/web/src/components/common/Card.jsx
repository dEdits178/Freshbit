import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const Card = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const Component = hover ? motion.div : 'div';

  const hoverProps = hover
    ? {
        whileHover: { y: -4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
        transition: { duration: 0.2 }
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white border border-gray-200 rounded-lg shadow-sm transition-shadow duration-200',
        paddings[padding],
        onClick && 'cursor-pointer',
        className
      )}
      {...hoverProps}
    >
      {children}
    </Component>
  );
};

export default Card;
