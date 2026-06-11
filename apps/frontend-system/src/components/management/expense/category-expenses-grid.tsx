import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useExpenseCategoriesOperation } from "@/hooks/management/expense/use-expense-categories-operations";
import { CircleOff, Edit, Ellipsis, Trash } from "lucide-react";
import { toIDR } from "../../../../utils/format-money";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ExpenseCategoriesForm from "./expense-categories-form";
import { useState } from "react";

export default function ExpenseCategoriesView() {
  const { dataExpenseCategories, removeByStatusData, removePermanentData } =
    useExpenseCategoriesOperation({});

  const removeByStatus = (id: string) => {
    removeByStatusData(id);
  };

  const removePermanent = (id: string) => {
    removePermanentData(id);
  };

  const [isExpenseCategoriesOpen, setIsExpenseCategoriesOpen] = useState(false);
  const [idData, setIdData] = useState("");

  const seletedData = dataExpenseCategories?.data?.find(
    (item) => item.id === idData,
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {dataExpenseCategories?.data?.map((item) => (
          <Card
            key={item.id}
            className={cn("relative shadow-md", !item.isActive && "opacity-60")}
          >
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="relative flex flex-col items-center justify-center">
                  <div
                    style={{ backgroundColor: `${item.color}` }}
                    className="size-4 rounded-full animate-ping flex items-center justify-center absolute"
                  ></div>
                  <div
                    className="size-3 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}` }}
                  ></div>
                </div>
                <div className="w-full">
                  <div className="flex gap-3 items-start">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex justify-center gap-3">
                        <h3 className="font-body font-semibold text-sm">
                          {item.name}
                        </h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size={"sm"}
                            className="h-full"
                          >
                            <Ellipsis />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => {
                                setIsExpenseCategoriesOpen(true);
                                setIdData(item.id);
                              }}
                            >
                              <Edit />
                              <p>Edit</p>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeByStatus(item.id)}
                            >
                              <CircleOff />
                              <p>Nonaktifkan</p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => removePermanent(item.id)}
                            >
                              <Trash />
                              <p>Hapus Permanent</p>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Badge className="bg-secondary/20 text-secondary">
                    {item.isActive ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
              </div>
              <p className="font-light font-body ">{item.description}</p>
              <Separator />
              <div className="flex justify-between">
                <div className="flex flex-col flex-1">
                  <p className="text-sm">Pengeluaran</p>
                  <h3 className="font-semibold text-lg">{item.expenseCount}</h3>
                </div>
                <div className="flex flex-col flex-1 text-end">
                  <p className="text-sm">Jumlah Total :</p>
                  <h3 className="font-semibold text-lg">
                    {toIDR(item.totalExpenses)}
                  </h3>
                </div>
              </div>
            </CardContent>
            <div
              className="w-full h-1 absolute bottom-0 left-0"
              style={{ backgroundColor: `${item.color}` }}
            ></div>
          </Card>
        ))}
      </div>
      <ExpenseCategoriesForm
        open={isExpenseCategoriesOpen}
        onOpenChange={setIsExpenseCategoriesOpen}
        idData={idData}
        dataCategory={seletedData}
      />
    </>
  );
}
