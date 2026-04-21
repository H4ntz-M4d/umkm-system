import { Card, CardContent } from "@/components/ui/card";
import {
  CirclePile,
  ShoppingBasket,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { SummaryData, z } from "@repo/schemas";

type SummaryDataResponse = z.infer<typeof SummaryData>;

const getDataCard = (dataSummary: SummaryDataResponse) => [
  {
    id: "STOCK-IN",
    title: "total stok masuk",
    icon: <TrendingUp color="green" />,
    value: dataSummary?.stockFlow?.totalIn ?? 0,
    description: "All stores",
  },
  {
    id: "STOCK-OUT",
    title: "total stok keluar",
    icon: <TrendingDown color="red" />,
    value: dataSummary?.stockFlow?.totalOut ?? 0,
    description: "All stores",
  },
  {
    id: "PRODUCT-VARIANT",
    title: "variant produk",
    icon: <ShoppingBasket className="text-secondary" />,
    value: dataSummary?.historyByType?.productVariant ?? 0,
    description: "All stores",
  },
  {
    id: "RAW-MATERIAL",
    title: "raw material",
    icon: <CirclePile />,
    value: dataSummary?.historyByType?.rawMaterial ?? 0,
    description: "All stores",
  },
];

export default function CardSummary({
  dataSummary,
}: {
  dataSummary: SummaryDataResponse;
}) {
  const data = getDataCard(dataSummary);
  
  return (
    <>
      {data.map((item, index) => (
        <Card key={index} className="bg-primary-foreground shadow">
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <p className="text-xs font-medium">{item.title.toUpperCase()}</p>
              {item.icon}
            </div>
            <h2 className="font-display font-extralight text-3xl">
              {item.value}
            </h2>
            <p className="text-black/50 dark:text-white font-stretch-condensed">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
