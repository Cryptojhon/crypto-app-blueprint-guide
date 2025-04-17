
import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon, CheckCircleIcon, AlertTriangleIcon, CreditCardIcon, BuildingIcon, WalletIcon, QrCodeIcon, CopyIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'SOMSH', name: 'Somali Shilling', symbol: 'Sh.So.', rate: 17600 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 151.14 }
];

const paymentMethods = [
  { id: 'bank_transfer', name: 'Bank Transfer', icon: BuildingIcon, processingTime: '1-3 business days', fee: 0 },
  { id: 'credit_card', name: 'Credit Card', icon: CreditCardIcon, processingTime: 'Instant', fee: 2.5 },
  { id: 'crypto_wallet', name: 'Crypto Wallet', icon: WalletIcon, processingTime: '10-30 minutes', fee: 1 }
];

const LIMITS = {
  deposit: {
    min: 10,
    max: 50000
  },
  withdraw: {
    min: 10,
    max: 25000
  }
};

// Mock deposit addresses for different payment methods
const depositAddresses = {
  bank_transfer: {
    accountName: "Tradelink Finance",
    accountNumber: "8762-5490-3219-0057",
    routingNumber: "074925698",
    bankName: "Secure Global Bank",
    reference: "TRDLNK-"
  },
  credit_card: {
    url: "https://secure-payment.example.com/deposit",
    reference: "CC-"
  },
  crypto_wallet: {
    btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    eth: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    usdt: "TXyz123abcPQrstuVWxyz456defGHjklm789Pqr",
    reference: "CRYPTO-"
  }
};

const fundSchema = z.object({
  amount: z.string()
    .refine((value) => !isNaN(Number(value)), {
      message: 'Amount must be a number',
    })
    .refine((value) => Number(value) > 0, {
      message: 'Amount must be greater than 0',
    }),
  currency: z.string().default('USD'),
  paymentMethod: z.string(),
  saveMethod: z.boolean().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

type FundFormValues = z.infer<typeof fundSchema>;

const FundsManagement = () => {
  const { addFunds, withdrawFunds, balance } = usePortfolio();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);
  const [transactionFee, setTransactionFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showQrCode, setShowQrCode] = useState(false);
  const [depositReference, setDepositReference] = useState("");
  const [lastTransaction, setLastTransaction] = useState<{
    success: boolean;
    type: 'deposit' | 'withdraw';
    amount: number;
    currency: string;
    reference?: string;
  } | null>(null);

  const form = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: '',
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      saveMethod: false,
      agreedToTerms: false
    },
  });

  useEffect(() => {
    form.reset({
      amount: '',
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      saveMethod: false,
      agreedToTerms: false
    });
    setLastTransaction(null);
    setProcessingProgress(0);
    setShowQrCode(false);
  }, [activeTab, form]);

  useEffect(() => {
    const methodId = form.watch('paymentMethod');
    const method = paymentMethods.find(m => m.id === methodId) || paymentMethods[0];
    setSelectedPaymentMethod(method);
  }, [form.watch('paymentMethod')]);

  useEffect(() => {
    const amount = Number(form.watch('amount')) || 0;
    const currencyCode = form.watch('currency');
    const currency = currencies.find(c => c.code === currencyCode) || currencies[0];
    const methodId = form.watch('paymentMethod');
    const method = paymentMethods.find(m => m.id === methodId) || paymentMethods[0];
    
    const convertedAmt = currency.code === 'USD' ? amount : amount / currency.rate;
    setConvertedAmount(convertedAmt);
    
    const fee = (method.fee / 100) * convertedAmt;
    setTransactionFee(fee);
    
    setTotalAmount(activeTab === 'deposit' ? convertedAmt + fee : convertedAmt - fee);
    
    setSelectedCurrency(currency);
  }, [form.watch('amount'), form.watch('currency'), form.watch('paymentMethod'), activeTab]);

  const simulateProcessing = () => {
    setProcessingProgress(0);
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 400);
    
    return interval;
  };

  const generateTransactionReference = () => {
    const methodId = form.getValues('paymentMethod');
    const prefix = depositAddresses[methodId as keyof typeof depositAddresses]?.reference || "TX-";
    return `${prefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`;
  };

  const generateDepositAddress = () => {
    const methodId = form.getValues('paymentMethod');
    const reference = generateTransactionReference();
    setDepositReference(reference);
    setShowQrCode(true);
    
    return {
      address: depositAddresses[methodId as keyof typeof depositAddresses],
      reference
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The address has been copied to your clipboard",
    });
  };

  const onSubmit = async (values: FundFormValues) => {
    if (activeTab === 'deposit') {
      generateDepositAddress();
      return;
    }
    
    setIsProcessing(true);
    const usdAmount = convertedAmount;
    const processingInterval = simulateProcessing();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      if (activeTab === 'deposit') {
        await addFunds(usdAmount);
        
        clearInterval(processingInterval);
        setProcessingProgress(100);
        
        setLastTransaction({
          success: true,
          type: 'deposit',
          amount: usdAmount,
          currency: values.currency,
          reference: generateTransactionReference()
        });
        
        toast({
          title: "Deposit Successful",
          description: `$${usdAmount.toFixed(2)} has been added to your account.`,
          variant: "default"
        });
      } else {
        await withdrawFunds(usdAmount);
        
        clearInterval(processingInterval);
        setProcessingProgress(100);
        
        setLastTransaction({
          success: true,
          type: 'withdraw',
          amount: usdAmount,
          currency: values.currency,
          reference: generateTransactionReference()
        });
        
        toast({
          title: "Withdrawal Initiated",
          description: `$${usdAmount.toFixed(2)} withdrawal has been processed.`,
          variant: "default"
        });
      }
      
      form.reset();
    } catch (error) {
      console.error(activeTab === 'deposit' ? 'Deposit error:' : 'Withdrawal error:', error);
      
      clearInterval(processingInterval);
      setProcessingProgress(0);
      
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

  const getTransactionLimits = () => {
    const limits = activeTab === 'deposit' ? LIMITS.deposit : LIMITS.withdraw;
    const currency = selectedCurrency;
    
    const minInCurrency = limits.min * (currency.code === 'USD' ? 1 : currency.rate);
    const maxInCurrency = limits.max * (currency.code === 'USD' ? 1 : currency.rate);
    
    return {
      min: minInCurrency,
      max: maxInCurrency
    };
  };

  const renderQrCodeContent = () => {
    const methodId = form.getValues('paymentMethod');
    const address = depositAddresses[methodId as keyof typeof depositAddresses];
    
    if (!address) return null;
    
    let qrValue = '';
    let displayAddress = '';
    
    if (methodId === 'bank_transfer') {
      qrValue = `Bank: ${address.bankName}\nAccount: ${address.accountNumber}\nRouting: ${address.routingNumber}\nRef: ${depositReference}`;
      displayAddress = address.accountNumber;
    } else if (methodId === 'credit_card') {
      qrValue = `${address.url}?ref=${depositReference}`;
      displayAddress = `${address.url}?ref=${depositReference}`;
    } else if (methodId === 'crypto_wallet') {
      // For crypto, we'll use the ETH address as an example
      qrValue = address.eth;
      displayAddress = address.eth;
    }
    
    return (
      <div className="mt-6 p-4 border rounded-md bg-muted/40">
        <div className="text-center mb-4">
          <h3 className="font-medium text-lg">Deposit Address</h3>
          <p className="text-sm text-muted-foreground mb-1">Scan this QR code or copy the address</p>
          <p className="text-xs text-muted-foreground">Reference: {depositReference}</p>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="p-3 bg-white rounded-lg mb-4">
            <QRCodeSVG value={qrValue} size={180} />
          </div>
          
          <div className="w-full flex items-center gap-2">
            <Input 
              value={displayAddress} 
              readOnly 
              className="font-mono text-xs"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => copyToClipboard(displayAddress)}
              className="flex-shrink-0"
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {methodId === 'crypto_wallet' && (
            <div className="w-full mt-4 grid grid-cols-2 gap-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">BTC: </span>
                <span className="font-mono">{address.btc.substring(0, 8)}...{address.btc.substring(address.btc.length - 8)}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(address.btc)} 
                className="h-6 text-xs"
              >
                <CopyIcon className="h-3 w-3 mr-1" /> Copy
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">USDT: </span>
                <span className="font-mono">{address.usdt.substring(0, 8)}...{address.usdt.substring(address.usdt.length - 8)}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(address.usdt)} 
                className="h-6 text-xs"
              >
                <CopyIcon className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Send {activeTab === 'deposit' ? form.getValues('amount') : convertedAmount.toFixed(2)} {form.getValues('currency')} to this address.
            {methodId === 'bank_transfer' && ' Include the reference in your transfer details.'}
          </p>
        </div>
      </div>
    );
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

        {isProcessing && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">
              {activeTab === 'deposit' 
                ? 'Processing your deposit...' 
                : 'Processing your withdrawal...'}
            </p>
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {processingProgress < 100 
                ? 'Please do not close this window...' 
                : 'Finalizing transaction...'}
            </p>
          </div>
        )}

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
                  ? (lastTransaction.type === 'deposit' ? 'Deposit Successful' : 'Withdrawal Initiated')
                  : (lastTransaction.type === 'deposit' ? 'Deposit Failed' : 'Withdrawal Failed')
                }
              </AlertTitle>
            </div>
            <AlertDescription>
              {lastTransaction.success 
                ? (
                  <div>
                    <p>
                      Your {lastTransaction.type} of {selectedCurrency.symbol}
                      {Number(lastTransaction.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} was processed successfully.
                    </p>
                    {lastTransaction.reference && (
                      <p className="text-xs mt-1">Reference: {lastTransaction.reference}</p>
                    )}
                    {lastTransaction.type === 'withdraw' && (
                      <p className="text-xs mt-1">
                        Please allow {selectedPaymentMethod.processingTime} for the funds to reach your account.
                      </p>
                    )}
                  </div>
                ) 
                : `We couldn't process your ${lastTransaction.type}. Please try again.`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-md mb-6">
          <p className="text-sm font-medium">Available Balance</p>
          <p className="text-xl font-bold">${balance.toLocaleString()}</p>
        </div>

        {showQrCode && activeTab === 'deposit' ? (
          <>
            {renderQrCodeContent()}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setShowQrCode(false)}
            >
              Back to Form
            </Button>
          </>
        ) : (
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
                      {Number(field.value) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Limits: {selectedCurrency.symbol}
                          {getTransactionLimits().min.toLocaleString(undefined, {minimumFractionDigits: 2})} - 
                          {selectedCurrency.symbol}
                          {getTransactionLimits().max.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </p>
                      )}
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

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {paymentMethods.map((method) => {
                          const MethodIcon = method.icon;
                          return (
                            <FormItem className="flex items-center space-x-3 space-y-0" key={method.id}>
                              <FormControl>
                                <RadioGroupItem value={method.id} />
                              </FormControl>
                              <FormLabel className="flex items-center space-x-2 cursor-pointer font-normal">
                                <MethodIcon className="h-4 w-4" />
                                <span>{method.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({method.processingTime}{method.fee > 0 ? `, ${method.fee}% fee` : ', No fee'})
                                </span>
                              </FormLabel>
                            </FormItem>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {Number(form.watch('amount')) > 0 && (
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount:</span>
                    <span>${convertedAmount.toFixed(2)}</span>
                  </div>
                  
                  {selectedPaymentMethod.fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        {selectedPaymentMethod.name} Fee ({selectedPaymentMethod.fee}%):
                      </span>
                      <span>${transactionFee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total {activeTab === 'deposit' ? 'to pay' : 'to receive'}:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {activeTab === 'deposit' 
                      ? `Your account will be credited with $${convertedAmount.toFixed(2)}`
                      : `$${transactionFee.toFixed(2)} will be deducted as a processing fee`
                    }
                  </div>
                </div>
              )}
              
              {activeTab === 'withdraw' && convertedAmount > balance && (
                <Alert variant="destructive" className="text-sm py-3">
                  <AlertDescription>
                    The amount you're trying to withdraw exceeds your available balance.
                  </AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="saveMethod"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Save payment method for future transactions
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="agreedToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to the terms and conditions
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={
                  isProcessing || 
                  form.formState.isSubmitting || 
                  (activeTab === 'withdraw' && convertedAmount > balance) ||
                  !form.watch('amount') ||
                  Number(form.watch('amount')) <= 0 ||
                  !form.watch('agreedToTerms')
                }
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Processing...
                  </span>
                ) : (
                  activeTab === 'deposit' 
                    ? (
                      <span className="flex items-center justify-center">
                        <QrCodeIcon className="mr-2 h-4 w-4" />
                        Generate Deposit Address
                      </span>
                    )
                    : `Withdraw ${convertedAmount > 0 ? '$' + convertedAmount.toFixed(2) : 'Funds'}`
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 text-sm flex flex-col p-4">
        <div className="flex items-center gap-2 mb-2">
          <WalletIcon className="h-4 w-4 text-primary" />
          <span className="font-medium">Processing Information</span>
        </div>
        {activeTab === 'deposit' ? (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Bank Transfer:</span> Funds will be available within 1-3 business days.
            </p>
            <p>
              <span className="font-medium">Credit Card:</span> Funds will be available immediately.
            </p>
            <p>
              <span className="font-medium">Crypto Wallet:</span> Funds will be available after blockchain confirmation (10-30 minutes).
            </p>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Bank Transfer:</span> Withdrawals typically process within 1-3 business days.
            </p>
            <p>
              <span className="font-medium">Credit Card:</span> Refunds to credit cards typically process within 3-5 business days.
            </p>
            <p>
              <span className="font-medium">Crypto Wallet:</span> Withdrawals typically process within 1-2 hours after approval.
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default FundsManagement;
