
import { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'SOMSH', name: 'Somali Shilling', symbol: 'Sh.So.', rate: 17600 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 151.14 }
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    success: boolean;
    type: 'deposit' | 'withdraw';
    amount: number;
    currency: string;
  } | null>(null);

  const form = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: '',
      currency: 'USD'
    },
  });

  // Reset form when tab changes
  useEffect(() => {
    form.reset();
    setLastTransaction(null);
  }, [activeTab, form]);

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
    setIsProcessing(true);
    const usdAmount = convertedAmount;
    
    try {
      if (activeTab === 'deposit') {
        await addFunds(usdAmount);
        setLastTransaction({
          success: true,
          type: 'deposit',
          amount: usdAmount,
          currency: values.currency
        });
      } else {
        await withdrawFunds(usdAmount);
        setLastTransaction({
          success: true,
          type: 'withdraw',
          amount: usdAmount,
          currency: values.currency
        });
      }
      
      form.reset();
    } catch (error) {
      console.error(activeTab === 'deposit' ? 'Deposit error:' : 'Withdrawal error:', error);
      setLastTransaction({
        success: false,
        type: activeTab,
        amount: usdAmount,
        currency: values.currency
      });
      
      toast({
        title: activeTab === 'deposit' ? 'Deposit Failed' : 'Withdrawal Failed',
        description: 'There was an error processing your transaction. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSignIcon className="h-5 w-5 text-primary" />
          Manage Funds
        </CardTitle>
        <CardDescription>Deposit or withdraw funds from your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6">
          <Button 
            variant={activeTab === 'deposit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('deposit')}
            className="flex-1 flex items-center justify-center"
          >
            <ArrowUpIcon className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button 
            variant={activeTab === 'withdraw' ? 'default' : 'outline'}
            onClick={() => setActiveTab('withdraw')}
            className="flex-1 flex items-center justify-center"
          >
            <ArrowDownIcon className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>

        {lastTransaction && (
          <Alert 
            className={`mb-4 ${lastTransaction.success ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300' : 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'}`}
          >
            <div className="flex items-center gap-2">
              {lastTransaction.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
              ) : (
                <AlertTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
              )}
              <AlertTitle>
                {lastTransaction.success 
                  ? (lastTransaction.type === 'deposit' ? 'Deposit Successful' : 'Withdrawal Successful')
                  : (lastTransaction.type === 'deposit' ? 'Deposit Failed' : 'Withdrawal Failed')
                }
              </AlertTitle>
            </div>
            <AlertDescription>
              {lastTransaction.success 
                ? `Your ${lastTransaction.type} of ${selectedCurrency.symbol}${Number(lastTransaction.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} was processed successfully.`
                : `We couldn't process your ${lastTransaction.type}. Please try again.`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-md mb-6">
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
              <Alert variant="destructive" className="text-sm py-3">
                <AlertDescription>
                  The amount you're trying to withdraw exceeds your available balance.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isProcessing || form.formState.isSubmitting || 
                (activeTab === 'withdraw' && convertedAmount > balance)}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Processing...
                </span>
              ) : (
                activeTab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="bg-muted/50 text-xs text-center text-muted-foreground">
        {activeTab === 'deposit' ? (
          <>Funds will be available immediately in your account.</>
        ) : (
          <>Withdrawals typically process within 1-3 business days.</>
        )}
      </CardFooter>
    </Card>
  );
};

export default FundsManagement;
