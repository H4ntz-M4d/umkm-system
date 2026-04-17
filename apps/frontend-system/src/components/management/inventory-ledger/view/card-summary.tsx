import { Card, CardContent } from "@/components/ui/card";
import { CirclePile, ShoppingBasket, TrendingDown, TrendingUp } from "lucide-react";

const dataCard = [
  {
    title: "total stok masuk",
    icon: <TrendingUp color="green" />,
    value: 10,
    description: "All stores",
  },
  {
    title: "total stok keluar",
    icon: <TrendingDown color="red" />,
    value: 10,
    description: "All stores",
  },
  {
    title: "variant produk",
    icon: <ShoppingBasket className="text-secondary" />,
    value: 10,
    description: "All stores",
  },
  {
    title: "raw material",
    icon: <CirclePile />,
    value: 10,
    description: "All stores",
  },
];

export default function CardSummary() {
  return (
    <>
      {dataCard.map((item, index) => (
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
