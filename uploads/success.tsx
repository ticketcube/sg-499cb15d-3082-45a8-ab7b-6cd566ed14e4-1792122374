
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import Head from 'next/head';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const { session_id } = router.query;

    useEffect(() => {
        // Redirect to games page after 3 seconds
        const timer = setTimeout(() => {
            router.push('/my-cubes'); // Changed from '/profile' to '/my-cubes'
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <>
            <Head>
                <title>Payment Successful - OTWChart</title>
            </Head>
            <Navbar />
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
                            See You on August 31!
                        </p>
                       
                        <Link href="/my-cubes" passHref>
                            <Button className="w-full">
                                Go to My Profile
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}