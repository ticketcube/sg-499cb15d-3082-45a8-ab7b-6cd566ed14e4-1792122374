
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Head from 'next/head';

export default function PaymentSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to homepage after 3 seconds to show the full game access
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <>
            <Head>
                <title>Payment Successful - Welcome to 4Under Club!</title>
            </Head>
            <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
                <Card className="w-full max-w-md text-center shadow-lg">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Welcome to the 4Under Club! You now have full access to all club features.
                        </p>
                        <p className="text-sm text-gray-600">
                            See you on August 31 at 6:10AM!
                        </p>
                        <p className="text-xs text-gray-500">
                            Redirecting to homepage in 3 seconds...
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Link href="/" passHref>
                                <Button className="w-full">
                                    Start Playing Now!
                                </Button>
                            </Link>
                            <Link href="/profile" passHref>
                                <Button variant="outline" className="w-full">
                                    View My Profile
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
