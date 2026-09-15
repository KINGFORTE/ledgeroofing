import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

const variants = {
  info: {
    wrapper: 'bg-primary/10 border-primary/25 text-ink',
    icon: 'text-primary',
    close: 'text-primary/60 hover:text-primary',
    Icon: Info,
  },
  warning: {
    wrapper: 'bg-amber-50 border-amber-300/40 text-ink',
    icon: 'text-amber-500',
    close: 'text-amber-400 hover:text-amber-600',
    Icon: AlertTriangle,
  },
  success: {
    wrapper: 'bg-green-50 border-green-300/40 text-ink',
    icon: 'text-green-500',
    close: 'text-green-400 hover:text-green-600',
    Icon: CheckCircle2,
  },
  error: {
    wrapper: 'bg-red-50 border-red-300/40 text-ink',
    icon: 'text-red-500',
    close: 'text-red-400 hover:text-red-600',
    Icon: AlertCircle,
  },
};

export default function AlertCard({
  variant = 'info',
  title,
  children,
  dismissible = true,
  onDismiss,
  icon: CustomIcon,
  className = '',
  link,
}) {
  const [visible, setVisible] = useState(true);
  const v = variants[variant] || variants.info;
  const IconComp = CustomIcon || v.Icon;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`overflow-hidden ${className}`}
        >
          <div
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 sm:items-center sm:gap-4 ${v.wrapper}`}
          >
            <IconComp className={`mt-0.5 h-5 w-5 shrink-0 sm:mt-0 ${v.icon}`} />
            <div className="min-w-0 flex-1">
              {title && (
                <p className="font-display text-sm font-bold leading-snug">{title}</p>
              )}
              {children && (
                <div className={`${title ? 'mt-1' : ''} text-sm leading-relaxed text-charcoal/80`}>
                  {children}
                </div>
              )}
              {link && (
                <a
                  href={link.href}
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
                >
                  {link.label}
                  <span aria-hidden="true">&rarr;</span>
                </a>
              )}
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                aria-label="Dismiss alert"
                className={`shrink-0 rounded-full p-1 transition-colors ${v.close}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
