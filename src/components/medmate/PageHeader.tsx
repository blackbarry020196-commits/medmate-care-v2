export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-8">
      <h1>{title}</h1>
      {subtitle && <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
