import { motion } from 'framer-motion';
import { viewportOnce } from '../utils/motion';

const directionMap = {
  up: { y: 48 },
  down: { y: -48 },
  left: { x: -56 },
  right: { x: 56 },
  upLeft: { x: -44, y: 44 },
  upRight: { x: 44, y: 44 },
  downLeft: { x: -44, y: -44 },
  downRight: { x: 44, y: -44 },
  zoom: { scale: 0.86 },
  rotate: { rotate: -10, scale: 0.93 },
};

export default function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.8,
  y,
  x,
  scale,
  rotate,
  as = 'div',
  ...rest
}) {
  const offset = directionMap[direction] || directionMap.up;
  const Comp = motion[as] || motion.div;

  return (
    <Comp
      className={className}
      initial={{
        opacity: 0,
        filter: 'blur(10px)',
        y: y ?? offset.y ?? 0,
        x: x ?? offset.x ?? 0,
        scale: scale ?? offset.scale ?? 1,
        rotate: rotate ?? offset.rotate ?? 0,
      }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0, x: 0, scale: 1, rotate: 0 }}
      viewport={viewportOnce}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}