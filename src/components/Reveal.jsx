import { motion } from 'framer-motion';
import { viewportOnce } from '../utils/motion';

const directionMap = {
  up: { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -40 }, show: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: 48 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: -48 }, show: { opacity: 1, x: 0 } },
  zoom: { hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1 } },
};

export default function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  y = 40,
  x = 0,
  scale = 1,
  as = 'div',
  ...rest
}) {
  const base = directionMap[direction] || directionMap.up;
  const Comp = motion[as] || motion.div;

  return (
    <Comp
      className={className}
      initial={{ ...base.hidden, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={viewportOnce}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
