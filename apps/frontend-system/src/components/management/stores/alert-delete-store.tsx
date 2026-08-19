import { MessageCircleWarningIcon } from "lucide-react";

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
} from "@/components/ui/alert-dialog";

export default function AlertDeleteStore({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-yellow-600/10 text-yellow-600">
            <MessageCircleWarningIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Toko?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p>
              Perhatian!! Jika anda{" "}
              <span className="underline font-bold text-destructive">
                menghapus Toko
              </span>
              , maka data-data penting dari toko tersebut yang ada pada
              fitur-fitur akan di hapus secara{" "}
              <span className="underline font-bold text-destructive">
                Permanen
              </span>
            </p>
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
