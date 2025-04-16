
import { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link as LinkIcon, GiftIcon, UserPlusIcon, CopyIcon, CheckIcon, Share2Icon, UsersIcon, BadgeCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ReferralSystem = () => {
  const { generateReferralLink, referralCode, referralCount, isLoadingReferral } = usePortfolio();
  const [referralLink, setReferralLink] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Calculate progress to next tier
  const nextTierThreshold = 5;
  const progress = Math.min(100, (referralCount / nextTierThreshold) * 100);

  // Set referral link when code is available
  useEffect(() => {
    if (referralCode) {
      setReferralLink(`${window.location.origin}/auth?ref=${referralCode}`);
    }
  }, [referralCode]);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const link = await generateReferralLink();
      setReferralLink(link);
      setShowShareOptions(true);
    } catch (error) {
      toast({
        title: "Error Generating Link",
        description: "Could not generate referral link. Please try again.",
        variant: "destructive"
      });
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

  const shareOnSocial = (platform: string) => {
    let url = "";
    const text = "Join me on this amazing platform and get a $5 bonus!";
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${text} ${referralLink}`)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <CardTitle className="flex items-center">
          <LinkIcon className="w-5 h-5 mr-2 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>Invite friends and earn rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {isLoadingReferral ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium">Referral Status</p>
                </div>
                <span className="text-sm font-bold">{referralCount} invited</span>
              </div>
              
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current</span>
                  <span>{referralCount >= nextTierThreshold ? "Gold Tier" : "Silver Tier"}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <GiftIcon className="w-5 h-5 text-primary" />
                <p className="font-medium">Rewards</p>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>You get $10 for each friend who signs up and deposits</li>
                <li>Your friend gets $5 bonus on their first deposit</li>
                {referralCount >= nextTierThreshold && (
                  <li className="font-medium text-primary flex items-center">
                    <BadgeCheck className="inline-block mr-1 h-4 w-4" />
                    Gold Tier: 15% bonus on all referral rewards
                  </li>
                )}
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isCopied ? "Copied!" : "Copy to clipboard"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                {showShareOptions && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Share via:</p>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20"
                        onClick={() => shareOnSocial('twitter')}
                      >
                        Twitter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 bg-[#4267B2]/10 hover:bg-[#4267B2]/20"
                        onClick={() => shareOnSocial('facebook')}
                      >
                        Facebook
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20"
                        onClick={() => shareOnSocial('whatsapp')}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                onClick={handleGenerateLink} 
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Share2Icon className="mr-2 h-4 w-4" />
                    Generate Referral Link
                  </span>
                )}
              </Button>
            )}
            
            {referralLink && !showShareOptions && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
                <Share2Icon className="mr-2 h-4 w-4" />
                Share Options
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
