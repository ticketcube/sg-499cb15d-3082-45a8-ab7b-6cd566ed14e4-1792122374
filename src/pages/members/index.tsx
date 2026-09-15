import Head from "next/head";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Trophy, Users, Share2, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  username: string;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const GOAL = 30;
  const PRICE = 50;
  const progressPercent = Math.min((totalPaid / GOAL) * 100, 100);

  useEffect(() => {
    fetchMembers();
    generateReferralCode();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("four_unders_waitlist")
        .select("username, created_at")
        .eq("paid", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMembers(data || []);
      setTotalPaid(data?.length || 0);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error loading members",
        description: "Please refresh the page to try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = () => {
    // Generate a unique 8-character code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setReferralCode(code);
  };

  const copyReferralLink = () => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/4unders?ref=${referralCode}`;
    
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    
    toast({
      title: "Link copied!",
      description: "Share this link with your golf buddies.",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Four Under Club Members - Tournament Progress</title>
        <meta name="description" content="Track our progress to the first Four Under tournament at Rancho Park" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Four Under Club Members
            </h1>
            <p className="text-lg text-gray-600">
              Building the fastest round at Rancho Park
            </p>
          </div>

          {/* Progress Card */}
          <Card className="border-2 border-emerald-300 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-600" />
                Tournament Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-3xl font-bold text-emerald-900">
                    {totalPaid} / {GOAL}
                  </span>
                  <span className="text-lg text-gray-600">
                    ${totalPaid * PRICE} / ${GOAL * PRICE}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-4" />
                <p className="text-sm text-gray-500 mt-2">
                  {GOAL - totalPaid} more members needed to book our first tournament
                </p>
              </div>

              {/* Economics Explanation */}
              <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
                <h3 className="font-bold text-lg mb-3 text-emerald-900">
                  How It Works: The Buffer System
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>30 members × $50 = $1,500 total</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>6 foursomes buffer:</strong> We book 6 groups ahead of us at Rancho's normal $50 greens fee
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>Result:</strong> With 6 groups (24 golfers) playing ahead, we're guaranteed space to play our round in under 4 hours
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>Each member pays double:</strong> Your $50 covers your round ($50) + contributes to the buffer system that guarantees pace
                    </p>
                  </div>
                </div>
              </div>

              {/* Referral Section */}
              <div className="border-t pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Share2 className="w-6 h-6 text-emerald-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      Invite Friends & Get Your Round Free
                    </h3>
                    <p className="text-sm text-gray-600">
                      Share your unique link. When 2 friends join and pay, your $50 membership is refunded.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-100 rounded-lg p-3 font-mono text-sm break-all">
                    {window.location.origin}/4unders?ref={referralCode}
                  </div>
                  <Button
                    onClick={copyReferralLink}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Club Members ({totalPaid})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-500 py-8">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Be the first to join! 🏌️
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {members.map((member, idx) => (
                    <div
                      key={idx}
                      className="bg-emerald-50 rounded-lg p-3 border border-emerald-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm truncate">
                          {member.username}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/4unders"}
              className="border-2"
            >
              Back to Four Under Club
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}