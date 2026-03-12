interface CarvedHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CarvedHeader({ title, subtitle, icon, actions }: CarvedHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 pb-6 border-b border-sepia-300/30">
      <div className="flex items-center gap-3">
        {icon && <span className="text-brass-500 shrink-0">{icon}</span>}
        <div>
          <h1 className="text-3xl font-serif font-bold text-sepia-900 tracking-tight letterpress">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sepia-600 mt-1.5 text-sm">{subtitle}</p>
          )}
          {/* Brass underline accent */}
          <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-brass-500 to-brass-300/0 rounded-full" />
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
