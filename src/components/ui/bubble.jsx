export function Bubble({
  align = 'start',
  variant = 'default',
  className = '',
  children,
  ...props
}) {
  const mine = align === 'end';
  const classes = [
    'msg-bubble-row',
    mine ? 'is-mine' : '',
    variant === 'muted' && !mine ? 'is-muted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <article className={`msg-bubble ${mine ? 'is-mine' : ''} ${className}`.trim()}>
        {children}
      </article>
    </div>
  );
}

export function BubbleContent({ className = '', children, ...props }) {
  return <p className={`msg-text ${className}`.trim()} {...props}>{children}</p>;
}

export function BubbleGroup({ className = '', children, ...props }) {
  return <div className={`msg-bubble-group ${className}`.trim()} {...props}>{children}</div>;
}

export function BubbleReactions({ className = '', children, ...props }) {
  return <div className={`msg-reactions ${className}`.trim()} {...props}>{children}</div>;
}
