
import { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { UsersIcon, CopyIcon, GiftIcon, CheckIcon, ShareIcon, TwitterIcon, FacebookIcon, LinkedinIcon } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MILESTONE_TIERS = [
  { count: 5, reward: '$25', achieved: false },
  { count: 10, reward: '$50', achieved: false },
  { count: 25, reward: '$150', achieved: false },
  { count: 50, reward: '$350', achieved: false },
  { count: 100, reward: '$1,000', achieved: false }
];

const ReferralSystem = () => {
  const { generateReferralLink, referralCode, referralCount, isLoadingReferral } = usePortfolio();
  const { toast } = useToast();
  const [referralLink, setReferralLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [milestones, setMilestones] = useState(MILESTONE_TIERS);
  const [nextTier, setNextTier] = useState<typeof MILESTONE_TIERS[0] | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Generate or fetch existing referral link
  useEffect(() => {
    if (referralCode) {
      setReferralLink(`${window.location.origin}/auth?ref=${referralCode}`);
    }
  }, [referralCode]);
  
  // Update milestones based on referral count
  useEffect(() => {
    if (referralCount > 0) {
      const updatedMilestones = milestones.map(milestone => ({
        ...milestone,
        achieved: referralCount >= milestone.count
      }));
      
      setMilestones(updatedMilestones);
      
      // Find the next milestone to achieve
      const nextMilestone = updatedMilestones.find(m => !m.achieved);
      setNextTier(nextMilestone || null);
      
      if (nextMilestone) {
        // Calculate progress percentage toward next milestone
        const prevMilestone = updatedMilestones[updatedMilestones.indexOf(nextMilestone) - 1];
        const startCount = prevMilestone ? prevMilestone.count : 0;
        const rangeSize = nextMilestone.count - startCount;
        const progress = referralCount - startCount;
        
        setProgressPercent(Math.min(100, (progress / rangeSize) * 100));
      } else {
        setProgressPercent(100); // All milestones achieved
      }
    }
  }, [referralCount]);

  const handleGenerateLink = async () => {
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
      toast({
        title: "Referral Link Generated",
        description: "Your referral link is ready to be shared.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate referral link.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied to Clipboard",
      description: "Referral link has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const message = encodeURIComponent("Join me on CryptoTrader and get a $10 bonus when you sign up and make your first deposit!");
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${message}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>Invite friends and earn rewards</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingReferral ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {!referralLink ? (
                <div>
                  <p className="text-sm mb-4">
                    Earn $10 for every friend who signs up using your referral link and makes their first deposit.
                  </p>
                  <Button onClick={handleGenerateLink} className="w-full">
                    Generate Referral Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-2">
                      <UsersIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Your Referrals</p>
                      <p className="text-2xl font-bold">{referralCount}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Referral Link</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 p-0" 
                        onClick={copyToClipboard}
                      >
                        {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex">
                      <Input 
                        value={referralLink} 
                        readOnly 
                        className="rounded-r-none"
                      />
                      <Button 
                        className="rounded-l-none" 
                        onClick={copyToClipboard}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  
                  {nextTier && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Next reward milestone: {nextTier.count} referrals</span>
                        <span className="font-medium">{referralCount} / {nextTier.count}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Unlock {nextTier.reward} bonus when you reach {nextTier.count} referrals!
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center">
                      <ShareIcon className="h-4 w-4 mr-1" /> Share with friends
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleShare('twitter')} 
                        className="rounded-full hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-950"
                      >
                        <TwitterIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleShare('facebook')}
                        className="rounded-full hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950"
                      >
                        <FacebookIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleShare('linkedin')}
                        className="rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                      >
                        <LinkedinIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {referralLink && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <GiftIcon className="h-4 w-4 text-primary" /> Reward Milestones
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {milestones.map((milestone) => (
                      <div 
                        key={milestone.count} 
                        className={`p-2 text-center rounded-md border ${
                          milestone.achieved 
                            ? 'bg-primary/10 border-primary/20' 
                            : 'bg-muted border-muted'
                        }`}
                      >
                        <p className={`text-xs ${milestone.achieved ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {milestone.count}
                        </p>
                        <p className={`text-sm font-bold ${milestone.achieved ? 'text-primary' : ''}`}>
                          {milestone.reward}
                        </p>
                        {milestone.achieved && (
                          <CheckIcon className="h-3 w-3 mx-auto mt-1 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-3">
        <Alert variant="default" className="py-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertDescription className="text-xs flex items-center gap-2">
            <GiftIcon className="h-4 w-4 text-blue-500" />
            <span>New users get $10 when they sign up with your link and make their first deposit!</span>
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  );
};

export default ReferralSystem;
