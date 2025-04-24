
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { PaymentMethodConfig } from '@/types/payment';
import { UseFormReturn } from 'react-hook-form';
import { FundFormValues } from './types';
import { Bitcoin } from 'lucide-react';

interface DepositFlowProps {
  form: UseFormReturn<FundFormValues>;
  paymentMethods: PaymentMethodConfig[];
  onShowQRCode: () => void;
  screenshotPreview: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DepositFlow = ({ 
  form, 
  paymentMethods, 
  onShowQRCode,
  screenshotPreview,
  onFileChange 
}: DepositFlowProps) => {
  return (
    <Card>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Cryptocurrency</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  {paymentMethods.map((method) => (
                    <FormItem className="flex items-center space-x-3 space-y-0" key={method.id}>
                      <FormControl>
                        <RadioGroupItem value={method.id} />
                      </FormControl>
                      <FormLabel className="flex items-center space-x-2 cursor-pointer font-normal">
                        <Bitcoin className="h-4 w-4" />
                        <span>{method.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({method.processingTime}{method.fee > 0 ? `, ${method.fee}% fee` : ''})
                        </span>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="screenshot"
          render={() => (
            <FormItem>
              <FormLabel>Upload Payment Screenshot</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="cursor-pointer"
                  />
                  {screenshotPreview && (
                    <div className="mt-2">
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot"
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
