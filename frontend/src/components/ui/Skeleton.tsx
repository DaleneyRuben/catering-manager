interface Props {
  className?: string;
}

export function Skeleton({ className = '' }: Props) {
  return <div className={`animate-pulse bg-cream-2 rounded ${className}`} />;
}
