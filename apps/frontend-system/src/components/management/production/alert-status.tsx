import { BluetoothIcon, MessageCircleWarningIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function AlertStatus({
  open,
  onOpenChange,
  onConfirm,
  statusData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  statusData?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-yellow-600/10 text-yellow-600">
            <MessageCircleWarningIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Ubah Status?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {statusData === "COMPLETED" ? (
              <p>
                Perhatian!! Jika anda mengubah status ke <span className="underline font-bold text-destructive">Selesai</span>
                , maka data tidak akan bisa di ubah lagi dan akan di simpan
                secara <span className="underline font-bold text-destructive">Permanen</span>
              </p>
            ) : (
              <p>
                Ini akan mengubah status produksi saat ini. Apakah anda ingin
                melanjutkan?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Lanjutkan</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
