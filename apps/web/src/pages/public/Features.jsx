import { motion } from 'framer-motion';
import { BarChart3, BellRing, FileUp, SearchCheck, Table2, Workflow } from 'lucide-react';
import Card from '../../components/common/Card';

const featureCards = [
  {
    icon: Workflow,
    title: 'End-to-end workflow orchestration',
    description: 'Handle invitation, screening, testing, interviews, and final selection from one command center.'
  },
  {
    icon: FileUp,
    title: 'Advanced file intake',
    description: 'Drag-and-drop uploads with validation and metadata readiness for profile and application pipelines.'
  },
  {
    icon: Table2,
    title: 'Enterprise data tables',
    description: 'Powerful search, sorting, and status rendering designed for high-volume placement operations.'
  },
  {
    icon: BellRing,
    title: 'Actionable notification layer',
    description: 'Notify every stakeholder in real time with role-aware updates and activity visibility.'
  },
  {
    icon: SearchCheck,
    title: 'Command palette navigation',
    description: 'Jump instantly across modules with Cmd/Ctrl+K for speed, focus, and operator efficiency.'
  },
  {
    icon: BarChart3,
    title: 'Insights and stage intelligence',
    description: 'Track drive outcomes, stage health, conversion rates, and trendlines for better decisions.'
  }
];

const Features = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Designed like an enterprise product.</h1>
        <p className="mt-3 max-w-3xl text-lg text-gray-600">
          FreshBit combines modern UX patterns with robust operational controls to help campuses and recruiters ship
          placement outcomes faster.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card hover className="h-full">
                <div className="mb-4 inline-flex rounded-lg bg-primary-50 p-2 text-primary-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Features;
