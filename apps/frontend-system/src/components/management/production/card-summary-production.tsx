import { Card, CardContent } from "@/components/ui/card";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { CheckCircle2, Clock, TimerIcon, XCircle } from "lucide-react";

export default function CardSummaryProduction() {
  const { fetchProductionSummaryData } = useProductionOperation({
    isTableMode: true,
  });
  const cardConfig = [
    {
      value: fetchProductionSummaryData?.data.planned,
      label: "RENCANA",
      icon: <TimerIcon />,
    },
    {
      value: fetchProductionSummaryData?.data.inProgress,
      label: "DI PROSES",
      icon: <Clock />,
    },
    {
      value: fetchProductionSummaryData?.data.completed,
      label: "SELESAI (bulan ini)",
      icon: <CheckCircle2 />,
    },
    {
      value: fetchProductionSummaryData?.data.cancelled,
      label: "BATAL (bulan ini)",
      icon: <XCircle />,
    },
  ];

  return (
    <>
      {cardConfig.map((item, index) => (
        <Card key={index} className="bg-primary-foreground shadow-md">
          <CardContent className="flex flex-row justify-between">
            <div className="space-y-3">
              <h3 className="text-xl">{item.label}</h3>
              <h1 className="text-3xl">{item.value}</h1>
            </div>
            <div className="size-10 flex justify-center items-center bg-primary/20 rounded-lg">
              {item.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
