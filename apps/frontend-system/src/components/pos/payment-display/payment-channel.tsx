import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { paymentChannelLabel } from "@/lib/payment/channel-label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { PaymentResponseData } from "@repo/schemas";

interface PaymentChannelProps {
  paymentData: PaymentResponseData[];
  setSelected: (selected: string | undefined) => void;
}

export default function PaymentChannel({
  paymentData,
  setSelected,
}: PaymentChannelProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | undefined>();

  const handleValueSelected = () => {
    setSelected(value);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <span>Metode Pembayaran</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Metode Pembayaran</DialogTitle>
          <DialogDescription>
            Pilih metode pembayaran yang ingin digunakan
          </DialogDescription>
        </DialogHeader>
        <div>
          <RadioGroup value={value} onValueChange={(value) => setValue(value)}>
            {paymentData.map((p) => (
              <FieldLabel key={p.id}>
                <Field orientation={"horizontal"}>
                  <FieldContent>
                    <FieldTitle>{p.name}</FieldTitle>
                    {/* Dua metode bisa sama-sama bernama "Qris"; keterangan
                        inilah yang memberi tahu kasir mana yang otomatis dan
                        mana yang perlu bukti. */}
                    <FieldDescription>
                      {paymentChannelLabel(p.channel)}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={p.id} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DialogClose asChild>
            <Button type="button" variant={"outline"}>
              Batal
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleValueSelected}>
            Pilih
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
