
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ticketCubeService } from "@/services/ticketCubeService";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    cubeId: string | null;
}

// IMPORTANT: Replace these with your actual Price IDs from your Stripe dashboard
const AUG31_4U_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_AUG31_4U_PRICE_ID || 'price_...';

const tiers = [
    {
        name: "August 31",
        price: "$35",
        description: "4Unders Club",
        features: [
            "Fun, Fast and Fair Golf
        ],
        priceId: null,
    }
];

export function PricingModal({ isOpen, onClose, cubeId }: PricingModalProps) {
    const [isLoading, setIsLoading] = useState < string | null > (null);
    const { user } = useAuth();
    const router = useRouter();

   

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Secure Your TicketCube™</DialogTitle>
                    <DialogDescription className="text-center">
                       Current Games Available For Booking
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
                    {tiers.map((tier) => (
                        <Card key={tier.name} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{tier.name}</CardTitle>
                                <CardDescription>{tier.description}</CardDescription>
                                <div className="text-4xl font-bold">{tier.price}</div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between">
                                <ul className="space-y-2 mb-6">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start">
                                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={() => handleSelectTier(tier)}
                                    disabled={!!isLoading}
                                    className="w-full"
                                >
                                    {isLoading === tier.name ? "Processing..." : `Select ${tier.name}`}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}