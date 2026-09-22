import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ProfileAvatar({ src, name, className }: { src: string | null; name: string; className?: string }) {
  const initials = name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "MR";
  return (
    <Avatar className={cn("border border-border bg-academic", className)}>
      {src && <AvatarImage src={src} alt={`Foto profil ${name}`} className="object-cover" />}
      <AvatarFallback className="bg-academic font-bold text-academic-foreground">{initials}</AvatarFallback>
    </Avatar>
  );
}