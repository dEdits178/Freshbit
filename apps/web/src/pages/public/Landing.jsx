import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, GraduationCap, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const Landing = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            Enterprise Placement Drive Management
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            The operating system for campus hiring collaboration.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            FreshBit connects administrators, companies, and colleges in one workflow engine — from invitations and
            applications to interview progression and final selection.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                Start free pilot
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="secondary">Explore features</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="space-y-5" padding="lg">
            {[
              {
                icon: ShieldCheck,
                title: 'Secure by default',
                text: 'JWT sessions, role-based access, and auditable activity timelines.'
              },
              {
                icon: Building2,
                title: 'Company coordination',
                text: 'Publish drives, manage applications, and update stages in real-time.'
              },
              {
                icon: GraduationCap,
                title: 'College execution',
                text: 'Track student readiness, validate docs, and reduce placement friction.'
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.08 }}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 p-4"
                >
                  <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;
