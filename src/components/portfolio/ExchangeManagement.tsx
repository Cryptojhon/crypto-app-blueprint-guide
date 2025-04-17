import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowRightIcon, DollarSignIcon, RepeatIcon, ChevronsUpDown, ArrowDownIcon, CheckCircleIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const exchangePairs = [
  { from: 'USD', to: 'SOMSH', rate: 17600, fee: 1.2 },
  { from: 'SOMSH', to: 'USD', rate: 1/17600, fee: 1.5 },
  { from: 'USD', to: 'BTC', rate: 1/62000, fee: 1.8 },
  { from: 'BTC', to: 'USD', rate: 62000, fee: 1.8 },
  { from: 'USD', to: 'ETH', rate: 1/3400, fee: 1.8 },
  { from: 'ETH', to: 'USD', rate: 3400, fee: 1.8 },
  { from: 'SOMSH', to: 'BTC', rate: 1/1091200000, fee: 2.0 },
  { from: 'BTC', to: 'SOMSH', rate: 1091200000, fee: 2.0 },
];

const currencies = {
  USD: { name: 'US Dollar', symbol: '$', decimals: 2 },
  SOMSH: { name: 'Somali Shilling', symbol: 'Sh.So.', decimals: 0 },
  BTC: { name: 'Bitcoin', symbol: '₿', decimals: 8 },
  ETH: { name: 'Ethereum', symbol: 'Ξ', decimals: 6 },
};

const exchangeSchema = z.object({
  fromCurrency: z.string(),
  toCurrency: z.string(),
  amount: z.string().refine((value) => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Amount must be a positive number',
  }),
});

type ExchangeFormValues = z.infer<typeof exchangeSchema>;

const ExchangeManagement = () => {
  const { toast } = useToast();
  const { balance } = usePortfolio();
  const [exchangeRate, setExchangeRate] = useState(0);
  const [exchangeFee, setExchangeFee] = useState(0);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [availablePairs, setAvailablePairs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeComplete, setExchangeComplete] = useState(false);

  const form = useForm<ExchangeFormValues>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      fromCurrency: 'USD',
      toCurrency: 'SOMSH',
      amount: '',
    },
  });

  useEffect(() => {
    const fromCurrency = form.watch('fromCurrency');
    const availableTo = exchangePairs
      .filter(pair => pair.from === fromCurrency)
      .map(pair => pair.to);
    
    setAvailablePairs(availableTo);
    
    const currentToCurrency = form.watch('toCurrency');
    if (!availableTo.includes(currentToCurrency)) {
      form.setValue('toCurrency', availableTo[0] || '');
    }
  }, [form.watch('fromCurrency'), form]);

  useEffect(() => {
    const fromCurrency = form.watch('fromCurrency');
    const toCurrency = form.watch('toCurrency');
    const amount = Number(form.watch('amount')) || 0;
    
    const pair = exchangePairs.find(p => p.from === fromCurrency && p.to === toCurrency);
    
    if (pair) {
      setExchangeRate(pair.rate);
      
      const converted = amount * pair.rate;
      const fee = (amount * pair.fee) / 100;
      setExchangeFee(fee);
      setConvertedAmount(converted - (converted * pair.fee / 100));
    } else {
      setExchangeRate(0);
      setExchangeFee(0);
      setConvertedAmount(0);
    }
  }, [form.watch('fromCurrency'), form.watch('toCurrency'), form.watch('amount')]);

  const formatCurrencyValue = (value: number, currencyCode: string) => {
    const currency = currencies[currencyCode as keyof typeof currencies];
    if (!currency) return value.toString();
    
    return value.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals
    });
  };

  const handleSwapCurrencies = () => {
    const from = form.getValues('fromCurrency');
    const to = form.getValues('toCurrency');
    
    const pairExists = exchangePairs.some(pair => pair.from === to && pair.to === from);
    
    if (pairExists) {
      form.setValue('fromCurrency', to);
      form.setValue('toCurrency', from);
      form.setValue('amount', '');
    } else {
      toast({
        title: "Invalid Exchange Pair",
        description: `Cannot exchange from ${to} to ${from}`,
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (values: ExchangeFormValues) => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setExchangeComplete(true);
      
      toast({
        title: "Exchange Successful",
        description: `Exchanged ${formatCurrencyValue(Number(values.amount), values.fromCurrency)} ${values.fromCurrency} to ${formatCurrencyValue(convertedAmount, values.toCurrency)} ${values.toCurrency}`,
        variant: "default"
      });
      
      setTimeout(() => {
        form.reset({
          fromCurrency: 'USD',
          toCurrency: 'SOMSH',
          amount: '',
        });
        setExchangeComplete(false);
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Exchange Failed",
        description: "There was an error processing your exchange. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RepeatIcon className="h-5 w-5 text-primary" />
          Currency Exchange
        </CardTitle>
        <CardDescription>Convert between currencies with competitive rates</CardDescription>
      </CardHeader>
      <CardContent>
        {exchangeComplete ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">Exchange Complete</h3>
            <p className="text-center text-muted-foreground mb-6">
              You have successfully exchanged {formatCurrencyValue(Number(form.getValues('amount')), form.getValues('fromCurrency'))} {form.getValues('fromCurrency')} to {formatCurrencyValue(convertedAmount, form.getValues('toCurrency'))} {form.getValues('toCurrency')}
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                form.reset({
                  fromCurrency: 'USD',
                  toCurrency: 'SOMSH',
                  amount: '',
                });
                setExchangeComplete(false);
              }}
            >
              Make Another Exchange
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(currencies).map(([code, details]) => (
                            <SelectItem key={code} value={code}>
                              {code} - {details.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="toCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availablePairs.map(code => (
                            <SelectItem key={code} value={code}>
                              {code} - {currencies[code as keyof typeof currencies]?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSwapCurrencies}
                  className="rounded-full"
                >
                  <ChevronsUpDown className="h-5 w-5" />
                </Button>
              </div>
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          {currencies[form.watch('fromCurrency') as keyof typeof currencies]?.symbol}
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
              
              {Number(form.watch('amount')) > 0 && (
                <div className="p-4 bg-muted rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Exchange Rate</p>
                      <p className="text-xs text-muted-foreground">
                        1 {form.watch('fromCurrency')} = {formatCurrencyValue(exchangeRate, form.watch('toCurrency'))} {form.watch('toCurrency')}
                      </p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">You pay</p>
                      <p className="font-medium">
                        {formatCurrencyValue(Number(form.watch('amount')), form.watch('fromCurrency'))} {form.watch('fromCurrency')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">You receive</p>
                      <p className="font-medium">
                        {formatCurrencyValue(convertedAmount, form.watch('toCurrency'))} {form.watch('toCurrency')}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm">
                    <span>Fee ({exchangePairs.find(p => p.from === form.watch('fromCurrency') && p.to === form.watch('toCurrency'))?.fee}%)</span>
                    <span className="text-muted-foreground">
                      ~{formatCurrencyValue(exchangeFee, form.watch('fromCurrency'))} {form.watch('fromCurrency')}
                    </span>
                  </div>
                </div>
              )}
              
              {form.watch('fromCurrency') === 'USD' && Number(form.watch('amount')) > balance && (
                <Alert variant="destructive" className="text-sm py-3">
                  <AlertDescription>
                    <ArrowDownIcon className="h-4 w-4 inline-block mr-1" />
                    Insufficient balance for this exchange
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={
                  isProcessing ||
                  !form.watch('amount') || 
                  Number(form.watch('amount')) <= 0 ||
                  (form.watch('fromCurrency') === 'USD' && Number(form.watch('amount')) > balance)
                }
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <RepeatIcon className="mr-2 h-4 w-4" />
                    Exchange {form.watch('fromCurrency')} to {form.watch('toCurrency')}
                  </span>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <DollarSignIcon className="h-3 w-3 inline-block mr-1" />
                Exchange rates are updated in real-time. Final amount may vary slightly based on market conditions at the time of exchange.
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default ExchangeManagement;
