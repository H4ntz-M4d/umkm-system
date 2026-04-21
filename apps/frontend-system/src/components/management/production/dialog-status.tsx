import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import AlertStatus from "./alert-status";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";

const status = [
  {
    id: "PLANNED",
    label: "Direncanakan",
    badgeStyle: "bg-blue-100 text-blue-700",
    pulseStyle: "w-2 h-2 bg-blue-600 rounded-full",
  },
  {
    id: "IN_PROGRESS",
    label: "Berjalan",
    badgeStyle: "bg-primary/15 text-primary",
    pulseStyle: "w-2 h-2 bg-primary rounded-full",
  },
  {
    id: "COMPLETED",
    label: "Selesai",
    badgeStyle: "bg-green-100 text-green-700",
    pulseStyle: "w-2 h-2 bg-green-600 rounded-full",
  },
  {
    id: "CANCELLED",
    label: "Dibatalkan",
    badgeStyle: "bg-red-100 text-red-700",
    pulseStyle: "w-2 h-2 bg-red-600 rounded-full",
  },
];

interface DialogStatusProps {
  idData: string;
  statusData: string;
}

export default function DialogStatus({
  idData,
  statusData,
}: DialogStatusProps) {
  const [statusChange, setStatusChange] = useState(statusData);
  const [openAlert, setOpenAlert] = useState(false);

  const handleOpenAlert = (id: string) => {
    if (id === statusData) return;
    setOpenAlert(true);
  };

  const { updateProductionStatusData, updateProductionStatusCompletedData } =
    useProductionOperation({});

  const handleUpdateStatus = (id: string) => {
    if (statusChange === "COMPLETED") {
      updateProductionStatusCompletedData({
        id,
        data: { status: statusChange },
      });
    } else {
      updateProductionStatusData({
        id,
        data: {
          status: statusChange as "PLANNED" | "IN_PROGRESS" | "CANCELLED",
        },
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" disabled={statusData === "COMPLETED"} >{statusData === "COMPLETED" ? "Selesai" : "Ubah Status"} </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-50" align="center">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-secondary">
              Pilih status produksi
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={statusChange}
              onValueChange={setStatusChange}
            >
              {status.map((item, i) => (
                <DropdownMenuRadioItem
                  className={statusData === item.id ? "bg-yellow-600/10" : ""}
                  value={item.id}
                  key={i}
                  onSelect={() => handleOpenAlert(item.id)}
                >
                  <Badge className={item.badgeStyle}>
                    <span className={item.pulseStyle}></span>
                    <p>{item.label}</p>
                  </Badge>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertStatus open={openAlert} onOpenChange={setOpenAlert} statusData={statusChange} onConfirm={() => handleUpdateStatus(idData)} />
    </>
  );
}
