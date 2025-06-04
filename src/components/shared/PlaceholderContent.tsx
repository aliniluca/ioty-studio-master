
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Compass } from "lucide-react"; 
import type { ReactNode } from "react";

interface PlaceholderContentProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children?: ReactNode; // Added children prop
}

export function PlaceholderContent({
  title,
  description = "Meșterii noștri lucrează cu drag la acest colțișor al tărâmului. Revino curând să vezi ce minunății au mai făurit!",
  icon: IconComponent = Compass,
  children, // Destructure children
}: PlaceholderContentProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center py-10">
      <Card className="w-full max-w-lg p-6 sm:p-8 shadow-xl bg-card">
        <CardHeader className="items-center">
          <IconComponent className="h-16 w-16 sm:h-20 sm:w-20 text-primary mb-6" />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-card-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-md sm:text-lg text-muted-foreground">
            {description}
          </CardDescription>
          {children && <div className="mt-6">{children}</div>} 
        </CardContent>
      </Card>
    </div>
  );
}
