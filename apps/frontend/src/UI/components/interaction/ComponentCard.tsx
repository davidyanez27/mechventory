interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
}

export const ComponentCard = ({
  title,
  children,
  className = "",
  desc = "",
}:ComponentCardProps) => {
  return (
    <div
      className={`rounded-2xl border border-border bg-card ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-medium text-card-foreground">{title}</h3>
        {desc && (
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 border-t border-border sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
