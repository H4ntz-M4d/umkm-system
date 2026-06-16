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
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { PAYMENT_METHOD } from "../pos-payment-dialog";

interface PaymentChannelProps {
  paymentData: PAYMENT_METHOD[];
  setSelected: (selected: number) => void;
}

export default function PaymentChannel({
  paymentData,
  setSelected,
}: PaymentChannelProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | null>();

  const handleValueSelected = () => {
    setSelected(Number(value));
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
          <RadioGroup onValueChange={(value) => setValue(Number(value))}>
            {paymentData.map((p) => (
              <FieldLabel key={p.paymentId}>
                <Field orientation={"horizontal"}>
                  <FieldContent>
                    <FieldTitle>{p.name}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem value={p.paymentId.toString()} />
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
