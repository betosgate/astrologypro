import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string;
  is_featured: boolean;
}

interface ServiceCardProps {
  service: Service;
  username: string;
}

export function ServiceCard({ service, username }: ServiceCardProps) {
  const isLongSession = service.duration_minutes >= 60;

  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-md">
      {service.is_featured && (
        <div className="absolute -top-2.5 right-4">
          <Badge className="bg-primary text-primary-foreground shadow-sm">
            Featured
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <Badge
            variant={isLongSession ? "default" : "outline"}
            className="shrink-0"
          >
            <Clock className="mr-1 size-3" />
            {service.duration_minutes} min
          </Badge>
        </div>
        {service.description && (
          <CardDescription className="line-clamp-3">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="mt-auto">
        <p className="text-2xl font-bold">{formatCurrency(service.price)}</p>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full gap-2">
          <Link href={`/${username}/book/${service.slug}`}>
            Book Now
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
