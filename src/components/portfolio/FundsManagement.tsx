import React, { useState } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { paymentMethods } from '@/types/payment';
import { DepositFlow } from './DepositFlow';
import { WithdrawalFlow } from './WithdrawalFlow';
import { QRCodeDialog } from './QRCodeDialog';
import { fundSchema, FundFormValues } from './types';
import { FundTab } from '@/types/payment';

const FundsManagement = () => {
  const { toast } = useToast();
  const { balance, addFunds, withdrawFunds } = usePortfolio();
  const [activeTab, setActiveTab] = useState<FundTab>('deposit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
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

  const selectedPaymentMethod = paymentMethods.find(m => m.id === form.watch('paymentMethod')) || paymentMethods[0];

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

  const onSubmit = async (values: FundFormValues) => {
    if (activeTab === 'deposit') {
      setShowQRCode(true);
      return;
    }

    // Here we're explicitly checking if activeTab is 'withdraw'
    if (activeTab === 'withdraw') {
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
        await withdrawFunds(amount);
        clearInterval(processingInterval);
        setProcessingProgress(100);
        
        toast({
          title: "Withdrawal Initiated",
          description: `$${amount.toFixed(2)} withdrawal has been processed.`,
          variant: "default"
        });
        
        form.reset();
        setScreenshotPreview(null);
      } catch (error) {
        console.error('Transaction error:', error);
        
        clearInterval(processingInterval);
        setProcessingProgress(0);
        
        toast({
          title: 'Withdrawal Failed',
          description: 'There was an error processing your transaction. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Funds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-6">
          <Button 
            variant={activeTab === 'deposit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('deposit')}
            className="flex-1"
          >
            Deposit
          </Button>
          <Button 
            variant={activeTab === 'withdraw' ? 'default' : 'outline'}
            onClick={() => setActiveTab('withdraw')}
            className="flex-1"
          >
            Withdraw
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-md mb-6">
          <p className="text-sm font-medium">Available Balance</p>
          <p className="text-xl font-bold">${balance.toLocaleString()}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {activeTab === 'deposit' ? (
              <>
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
                <DepositFlow 
                  form={form} 
                  paymentMethods={paymentMethods}
                  onShowQRCode={() => setShowQRCode(true)}
                  screenshotPreview={screenshotPreview}
                  onFileChange={handleFileChange}
                />
              </>
            ) : (
              <WithdrawalFlow form={form} />
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
                activeTab === 'deposit' ? 'Show Payment QR Code' : 'Withdraw Funds'
              )}
            </Button>
          </form>
        </Form>

        <QRCodeDialog
          open={showQRCode}
          onOpenChange={setShowQRCode}
          selectedPaymentMethod={selectedPaymentMethod}
          amount={form.watch('amount')}
        />
      </CardContent>
    </Card>
  );
};

export default FundsManagement;
