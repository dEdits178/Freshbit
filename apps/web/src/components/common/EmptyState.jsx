import { motion } from 'framer-motion';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  illustration
}) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <motion.div
          className="mb-6 p-4 bg-gray-100 rounded-full"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-12 h-12 text-gray-400" />
        </motion.div>
      ) : null}

      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</h3>

      {description && <p className="text-gray-600 text-center max-w-md mb-6">{description}</p>}

      {action && (
        <Button variant={action.variant || 'primary'} onClick={action.onClick} icon={action.icon}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
