export const EASE = [0.22, 1, 0.36, 1];

const blurIn = (offset) => ({
  hidden: { opacity: 0, filter: 'blur(10px)', ...offset },
  show: {
    opacity: 1,
    filter: 'blur(0px)',
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.8, ease: EASE },
  },
});

export const fadeUp = blurIn({ y: 48 });

export const fadeLeft = blurIn({ x: -56 });

export const fadeRight = blurIn({ x: 56 });

export const scaleIn = blurIn({ scale: 0.9 });

export const staggerContainer = (stagger = 0.12, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

const directions = ['left', 'right', 'zoom', 'up', 'right', 'left', 'down', 'zoom'];

export const directionalFade = (index = 0, distance = 56) => {
  const dir = directions[index % directions.length];
  const offset =
    dir === 'left'
      ? { x: -distance }
      : dir === 'right'
        ? { x: distance }
        : dir === 'zoom'
          ? { scale: 0.86 }
          : dir === 'down'
            ? { y: -distance }
            : { y: distance };
  return blurIn(offset);
};

export const viewportOnce = { once: true, margin: '-80px' };