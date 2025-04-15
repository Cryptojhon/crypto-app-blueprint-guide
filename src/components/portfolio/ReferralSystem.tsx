
import { useState } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, GiftIcon, UserPlusIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const ReferralSystem = () => {
  const { generateReferralLink, referralCode, referralCount, isLoadingReferral } = usePortfolio();
  const [referralLink, setReferralLink] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Referral Program
        </CardTitle>
        <CardDescription>Invite friends and earn rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingReferral ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <UserPlusIcon className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm">
                <span className="font-bold">{referralCount}</span> friends have used your referral
              </p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <GiftIcon className="w-5 h-5 text-primary" />
                <p className="font-medium">Rewards</p>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>You get $10 for each friend who signs up and deposits</li>
                <li>Your friend gets $5 bonus on their first deposit</li>
              </ul>
            </div>

            {referralCode || referralLink ? (
              <div className="space-y-2">
                <label htmlFor="referral-link" className="text-sm font-medium">
                  Your Referral Link
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="referral-link"
                      value={referralLink || `${window.location.origin}/auth?ref=${referralCode}`}
                      readOnly
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={copyToClipboard}
                    >
                      {isCopied ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleGenerateLink} 
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Referral Link"}
              </Button>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
        Share your unique link with friends via email, social media, or messaging apps.
      </CardFooter>
    </Card>
  );
};

export default ReferralSystem;
