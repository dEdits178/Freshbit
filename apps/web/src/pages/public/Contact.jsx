import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const Contact = () => {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Talk to the FreshBit team</h1>
        <p className="mt-3 text-lg text-gray-600">
          Planning a campus hiring transformation? We’ll help you design a role-based operating model for your
          institution, recruiters, and placement coordinators.
        </p>

        <div className="mt-8 space-y-3">
          {[
            { icon: Mail, label: 'Email', value: 'hello@freshbit.app' },
            { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
            { icon: MessageSquare, label: 'Support', value: 'Mon-Fri • 9:00 AM - 7:00 PM IST' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} padding="sm" className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-50 p-2 text-primary-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card padding="lg">
          <h2 className="text-xl font-semibold text-gray-900">Request a walkthrough</h2>
          <p className="mt-1 text-sm text-gray-600">Share a few details and our team will get back within one business day.</p>

          <form className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input className="input-base mt-1" placeholder="Enter your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Work email</label>
              <input className="input-base mt-1" placeholder="you@organization.com" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <input className="input-base mt-1" placeholder="College or company name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea className="input-base mt-1 min-h-[120px]" placeholder="Tell us about your placement workflow goals" />
            </div>
            <Button fullWidth>Send request</Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Contact;
