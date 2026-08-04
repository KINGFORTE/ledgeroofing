import useCountUp from '../hooks/useCountUp';

export default function AnimatedCounter({
  end,
  suffix = '',
  prefix = '',
  duration = 2,
  className = '',
}) {
  const { ref, value } = useCountUp(end, { duration: duration * 1000 });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
