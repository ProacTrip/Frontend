type LoaderProps = {
  text?: string;
  size?: 'sm' | 'md';
};

export default function Loader({
  text = 'Cargando...',
  size = 'md',
}: LoaderProps) {
  const sizeClasses =
    size === 'sm'
      ? 'w-4 h-4 border-2'
      : 'w-5 h-5 border-2';

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
      <div
        className={`${sizeClasses} border-gray-300 border-t-blue-500 rounded-full animate-spin`}
      />
      {text && <span>{text}</span>}
    </div>
  );
}
