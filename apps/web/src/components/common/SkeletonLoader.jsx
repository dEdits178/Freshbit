import { cn } from '../../utils/helpers';

const SkeletonLoader = ({ className, variant = 'default' }) => {
  const variants = {
    default: 'h-4 w-full',
    circle: 'rounded-full',
    text: 'h-4',
    title: 'h-8',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-32 w-full'
  };

  return <div className={cn('skeleton', variants[variant], className)} />;
};

export const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
    <SkeletonLoader variant="title" className="w-1/3" />
    <SkeletonLoader className="w-full" />
    <SkeletonLoader className="w-2/3" />
    <SkeletonLoader className="w-1/2" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <SkeletonLoader variant="circle" className="w-10 h-10" />
        <SkeletonLoader className="flex-1" />
        <SkeletonLoader className="w-24" />
      </div>
    ))}
  </div>
);

export const SkeletonStatCard = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <SkeletonLoader className="w-24" />
        <SkeletonLoader variant="title" className="w-16" />
      </div>
      <SkeletonLoader variant="circle" className="w-12 h-12" />
    </div>
  </div>
);

export default SkeletonLoader;
