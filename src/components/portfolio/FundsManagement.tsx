
import { useState } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

const fundSchema = z.object({
  amount: z.string()
    .refine((value) => !isNaN(Number(value)), {
      message: 'Amount must be a number',
    })
    .refine((value) => Number(value) > 0, {
      message: 'Amount must be greater than 0',
    })
});

type FundFormValues = z.infer<typeof fundSchema>;

const FundsManagement = () => {
  const { addFunds, withdrawFunds, balance } = usePortfolio();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const form = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: '',
    },
  });

  const onSubmit = async (values: FundFormValues) => {
    const amount = Number(values.amount);
    
    if (activeTab === 'deposit') {
      await addFunds(amount);
    } else {
      await withdrawFunds(amount);
    }
    
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Funds</CardTitle>
        <CardDescription>Deposit or withdraw funds from your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Button 
            variant={activeTab === 'deposit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('deposit')}
            className="flex items-center"
          >
            <ArrowUpIcon className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button 
            variant={activeTab === 'withdraw' ? 'default' : 'outline'}
            onClick={() => setActiveTab('withdraw')}
            className="flex items-center"
          >
            <ArrowDownIcon className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {activeTab === 'deposit' 
            ? 'Add funds to your account to trade assets.' 
            : 'Withdraw funds from your account.'}
        </p>

        <div className="mb-4">
          <p className="text-sm font-medium">Available Balance</p>
          <p className="text-xl font-bold">${balance.toLocaleString()}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                      <Input 
                        placeholder="0.00" 
                        className="pl-7" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {activeTab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default FundsManagement;
