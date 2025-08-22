
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import Head from 'next/head';

export default function PaymentCancelPage() {
    return (
        <>
            <Head>
                <title>Payment Canceled - 4Under Club</title>
            </Head>
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
                <Card className="w-full max-w-md text-center shadow-lg">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-bold">Payment Canceled</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Your payment process was canceled. You have not been charged.
                        </p>
                        <p className="text-sm text-gray-600">
                            You can try again anytime to join the August 31 game.
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Link href="/join-game" passHref>
                                <Button className="w-full">
                                    Try Again
                                </Button>
                            </Link>
                            <Link href="/auth/login" passHref>
                                <Button variant="outline" className="w-full">
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
