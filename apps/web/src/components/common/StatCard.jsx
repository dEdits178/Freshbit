import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Card from './Card';
import { cn } from '../../utils/helpers';
import { ICON_BG_COLORS } from '../../utils/constants';

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = 'blue',
  trend,
  trendUp = true,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </Card>
    );
  }

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>

          <motion.p
            className="text-3xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>

          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                trendUp ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>

        {Icon && (
          <motion.div
            className={cn('p-3 rounded-xl', ICON_BG_COLORS[iconColor] || ICON_BG_COLORS.blue)}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
