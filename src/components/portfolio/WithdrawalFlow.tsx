
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { FundFormValues } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WithdrawalFlowProps {
  form: UseFormReturn<FundFormValues>;
}

export const WithdrawalFlow = ({ form }: WithdrawalFlowProps) => {
  const { user } = useAuth();
  const [withdrawalAddress, setWithdrawalAddress] = React.useState('');

  React.useEffect(() => {
    const fetchWithdrawalAddress = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('withdrawal_address')
        .eq('id', user.id)
        .single();
        
      if (data?.withdrawal_address) {
        setWithdrawalAddress(data.withdrawal_address);
      }
    };

    fetchWithdrawalAddress();
  }, [user]);

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setWithdrawalAddress(newAddress);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ withdrawal_address: newAddress })
        .eq('id', user.id);
    }
  };

  return (
    <Card>
      <CardContent>
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Amount (USD)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Withdrawal Address</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter your withdrawal address"
                  value={withdrawalAddress}
                  onChange={handleAddressChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
