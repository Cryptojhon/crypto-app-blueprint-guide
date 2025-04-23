
import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, WalletIcon, AlertTriangle, Bitcoin, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PaymentMethod, FundTab } from '@/types/payment';
import { Image } from '@/components/ui/image';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { QRCodeSVG } from 'qrcode.react';

// Add transaction reference to the interface
interface LastTransaction {
  success: boolean;
  type: FundTab;
  amount: number;
  reference?: string;
}

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
  screenshot: z.instanceof(File).optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

// Cryptocurrency payment methods
const cryptoPayments = [
  { 
    id: 'bitcoin', 
    name: 'Bitcoin (BTC)', 
    processingTime: '10-30 min', 
    fee: 1.8,
    address: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
    qrValue: 'bitcoin:3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5'
  },
  { 
    id: 'ethereum', 
    name: 'Ethereum (ETH)', 
    processingTime: '5-10 min', 
    fee: 1.8,
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    qrValue: 'ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
  },
  { 
    id: 'bnb', 
    name: 'BNB', 
    processingTime: '3-8 min', 
    fee: 1.5,
    address: 'bnb1m4m9etgf3ca5wpgkqe5nr6r33a4ynyd2cagm5h',
    qrValue: 'bnb:bnb1m4m9etgf3ca5wpgkqe5nr6r33a4ynyd2cagm5h'
  },
  { 
    id: 'usdt', 
    name: 'Tether (USDT)', 
    processingTime: '5-15 min', 
    fee: 1.2,
    address: 'TEwRGKuHQtshchpJstVKBnZvr3oUcnC6t3',
    qrValue: 'tether:TEwRGKuHQtshchpJstVKBnZvr3oUcnC6t3'
  },
  { 
    id: 'solana', 
    name: 'Solana (SOL)', 
    processingTime: '1-5 min', 
    fee: 1.5,
    address: 'DyGvW5nxCQrwgXbFDEbLTbS6NyGTm9BaVVSTmkgALi3S',
    qrValue: 'solana:DyGvW5nxCQrwgXbFDEbLTbS6NyGTm9BaVVSTmkgALi3S'
  }
];

type FundFormValues = z.infer<typeof fundSchema>;

const FundsManagement = () => {
  const { toast } = useToast();
  const { balance, addFunds, withdrawFunds } = usePortfolio();
  const [activeTab, setActiveTab] = useState<FundTab>('deposit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [lastTransaction, setLastTransaction] = useState<LastTransaction | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(cryptoPayments[0]);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const form = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: '',
      currency: 'USD',
      paymentMethod: 'bitcoin',
      agreedToTerms: false
    },
  });

  useEffect(() => {
    const methodId = form.watch('paymentMethod');
    const method = cryptoPayments.find(m => m.id === methodId) || cryptoPayments[0];
    setSelectedPaymentMethod(method);
  }, [form.watch('paymentMethod')]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('screenshot', file);
    }
  };

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
    return `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`;
  };

  const onSubmit = async (values: FundFormValues) => {
    // Use type guard with string literal to avoid type errors
    if (activeTab === 'deposit') {
      setShowQRCode(true);
      return;
    }
    
    // This is for withdraw flow
    if (!values.screenshot) {
      toast({
        title: "Screenshot Required",
        description: "Please upload a screenshot of your payment confirmation",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    const amount = Number(values.amount);
    const processingInterval = simulateProcessing();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Use type guard with string literal to avoid type errors
      if (activeTab === 'withdraw') {
        await withdrawFunds(amount);
        clearInterval(processingInterval);
        setProcessingProgress(100);
        
        // Include reference in the lastTransaction
        const reference = generateTransactionReference();
        setLastTransaction({
          success: true,
          type: 'withdraw',
          amount,
          reference
        });
        
        toast({
          title: "Withdrawal Initiated",
          description: `$${amount.toFixed(2)} withdrawal has been processed.`,
          variant: "default"
        });
      }
      
      form.reset();
      setScreenshotPreview(null);
    } catch (error) {
      console.error('Transaction error:', error);
      
      clearInterval(processingInterval);
      setProcessingProgress(0);
      
      setLastTransaction({
        success: false,
        type: activeTab,
        amount
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
          <WalletIcon className="h-5 w-5 text-primary" />
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
            <Separator className="my-2" />
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
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
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
                      Your {lastTransaction.type} of ${lastTransaction.amount.toLocaleString()} was processed successfully.
                    </p>
                    {lastTransaction.reference && (
                      <p className="text-xs mt-1">Reference: {lastTransaction.reference}</p>
                    )}
                    <p className="text-xs mt-1">
                      Please allow 5-15 minutes for the funds to reach your account.
                    </p>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {activeTab === 'deposit' && (
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
                        {cryptoPayments.map((method) => (
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {activeTab === 'withdraw' && (
              <FormField
                control={form.control}
                name="screenshot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Payment Screenshot</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
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
            )}
            
            <FormField
              control={form.control}
              name="agreedToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="form-checkbox"
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
                !form.watch('amount') || 
                Number(form.watch('amount')) <= 0 ||
                !form.watch('agreedToTerms') ||
                (activeTab === 'withdraw' && !form.watch('screenshot'))
              }
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  {activeTab === 'deposit' ? (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Show Payment QR Code
                    </>
                  ) : (
                    <>
                      <ArrowDownIcon className="mr-2 h-4 w-4" />
                      Withdraw Funds
                    </>
                  )}
                </span>
              )}
            </Button>
          </form>
        </Form>

        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent>
            <DialogTitle>{selectedPaymentMethod.name} Payment Instructions</DialogTitle>
            <DialogDescription>
              Please send {form.watch('amount')} USD worth of {selectedPaymentMethod.name} to the following address:
            </DialogDescription>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-sm bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={`${selectedPaymentMethod.qrValue}?amount=${form.watch('amount')}`}
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
              <Button onClick={() => setShowQRCode(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FundsManagement;
