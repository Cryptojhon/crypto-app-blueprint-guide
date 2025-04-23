
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { FundFormValues } from './types';

interface WithdrawalFlowProps {
  form: UseFormReturn<FundFormValues>;
  screenshotPreview: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WithdrawalFlow = ({ form, screenshotPreview, onFileChange }: WithdrawalFlowProps) => {
  return (
    <Card>
      <CardContent>
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
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
