
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentMethodConfig } from '@/types/payment';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPaymentMethod: PaymentMethodConfig;
  amount: string;
}

export const QRCodeDialog = ({ open, onOpenChange, selectedPaymentMethod, amount }: QRCodeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{selectedPaymentMethod.name} Payment Instructions</DialogTitle>
        <DialogDescription>
          Please send {amount} USD worth of {selectedPaymentMethod.name} to the following address:
        </DialogDescription>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-w-sm bg-white p-4 rounded-lg">
            <QRCodeSVG
              value={`${selectedPaymentMethod.qrValue}?amount=${amount}`}
              size={250}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={true}
              className="w-full h-auto"
            />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium mb-1">Wallet Address:</p>
            <code className="block w-full p-2 bg-muted rounded text-sm break-all">
              {selectedPaymentMethod.address}
            </code>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            After sending the payment, please take a screenshot of the confirmation
            and keep it for your records.
          </p>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
