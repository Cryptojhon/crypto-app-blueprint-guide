
import { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'SOMSH', name: 'Somali Shilling', symbol: 'Sh.So.', rate: 17600 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 }
];

const fundSchema = z.object({
  amount: z.string()
    .refine((value) => !isNaN(Number(value)), {
      message: 'Amount must be a number',
    })
    .refine((value) => Number(value) > 0, {
      message: 'Amount must be greater than 0',
    }),
  currency: z.string().default('USD')
});

type FundFormValues = z.infer<typeof fundSchema>;

const FundsManagement = () => {
  const { addFunds, withdrawFunds, balance } = usePortfolio();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  const form = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: '',
      currency: 'USD'
    },
  });

  // Calculate the converted amount when currency or amount changes
  useEffect(() => {
    const amount = Number(form.watch('amount')) || 0;
    const currencyCode = form.watch('currency');
    const currency = currencies.find(c => c.code === currencyCode) || currencies[0];
    
    if (currency.code === 'USD') {
      setConvertedAmount(amount);
    } else {
      // Convert to USD (our base currency for the wallet)
      setConvertedAmount(amount / currency.rate);
    }
    
    setSelectedCurrency(currency);
  }, [form.watch('amount'), form.watch('currency')]);

  const onSubmit = async (values: FundFormValues) => {
    const usdAmount = convertedAmount; // This is already in USD
    
    if (activeTab === 'deposit') {
      await addFunds(usdAmount);
    } else {
      await withdrawFunds(usdAmount);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          {selectedCurrency.symbol}
                        </span>
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
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedCurrency.code !== 'USD' && Number(form.watch('amount')) > 0 && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium flex items-center">
                  <DollarSignIcon className="h-4 w-4 mr-1" />
                  Conversion Preview
                </p>
                <p className="text-muted-foreground">
                  {Number(form.watch('amount')).toLocaleString()} {selectedCurrency.code} = 
                  <span className="font-medium text-foreground"> ${convertedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rate: 1 USD = {selectedCurrency.rate} {selectedCurrency.code}
                </p>
              </div>
            )}

            {activeTab === 'withdraw' && convertedAmount > balance && (
              <p className="text-destructive text-sm">
                The amount you're trying to withdraw exceeds your available balance.
              </p>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={form.formState.isSubmitting || 
                (activeTab === 'withdraw' && convertedAmount > balance)}
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
