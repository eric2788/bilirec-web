export function EmptyState({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-muted-foreground text-lg mb-2 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}
