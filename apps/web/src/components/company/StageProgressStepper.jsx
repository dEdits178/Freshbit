import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const StageProgressStepper = ({ currentStage, stages = [] }) => {
  const order = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'];
  const normalized = order.map((name) => {
    const found = stages.find((s) => s.name === name) || {};
    const isActive = (found.isActive || currentStage === name) && !found.isCompleted;
    return {
      name,
      isCompleted: !!found.isCompleted,
      isActive,
      isPending: !isActive && !found.isCompleted
    };
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] flex items-center gap-3">
        {normalized.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                className={`flex items-center justify-center w-8 h-8 rounded-full border ${
                  s.isCompleted
                    ? 'bg-green-500 text-white border-green-500'
                    : s.isActive
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-200 text-gray-700 border-gray-300'
                }`}
                animate={s.isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={s.isActive ? { repeat: Infinity, duration: 1.6 } : {}}
              >
                {s.isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </motion.div>
              <p className="mt-1 text-xs font-medium text-gray-700">{s.name}</p>
            </div>
            {i < normalized.length - 1 && (
              <div className={`h-0.5 w-12 ${normalized[i + 1].isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageProgressStepper;
