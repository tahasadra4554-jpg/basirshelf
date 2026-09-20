import { BookOpen, FileText, PlayCircle, Users } from "lucide-react";

import { Container } from "@/components/site/container";

export function StatsStrip({
  bookCount,
  sectionCount,
}: {
  bookCount: number;
  sectionCount: number;
}) {
  const stats = [
    { icon: BookOpen, label: "Books on the shelf", value: bookCount },
    { icon: PlayCircle, label: "Units & lessons", value: sectionCount },
    { icon: FileText, label: "PDF handouts", value: sectionCount },
    { icon: Users, label: "Teachers with you", value: 7 },
  ];

  return (
    <div className="border-y border-border bg-card">
      <Container className="py-9">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-accent"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="num-latin text-2xl font-extrabold tracking-tight">
                  {stat.value}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
