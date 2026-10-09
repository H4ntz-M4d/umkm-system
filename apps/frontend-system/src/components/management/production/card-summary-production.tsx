"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { CheckCircle2, Clock, PackageSearch, TimerIcon } from "lucide-react";

export default function CardSummaryProduction() {
  const { productionSummary } = useProductionOperation({});
  const summary = productionSummary?.data;

  const cards = [
    {
      value: summary?.planned ?? 0,
      label: "DIRENCANAKAN",
      icon: <TimerIcon />,
    },
    { value: summary?.inProgress ?? 0, label: "DIKERJAKAN", icon: <Clock /> },
    {
      value: summary?.completed ?? 0,
      label: "SELESAI",
      icon: <CheckCircle2 />,
    },
    {
      /// Bukan jumlah batch, tapi jumlah pcs — pertanyaan yang sebenarnya
      /// adalah "berapa lagi yang belum jadi".
      value: `${summary?.outstandingQuantity ?? 0} pcs`,
      label: "BELUM JADI",
      icon: <PackageSearch />,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <h2 className="mt-1 text-3xl">{card.value}</h2>
            </div>
            <span className="text-muted-foreground">{card.icon}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
