
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StripeTestPage() {
    const [testResult, setTestResult] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const testStripePrice = async () => {
        setLoading(true);
        setTestResult('Testing...');

        try {
            const priceId = process.env.NEXT_PUBLIC_STRIPE_AUG31_4U_PRICE_ID;
            
            console.log('Testing price ID:', priceId);
            
            const response = await fetch('/api/stripe/test-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setTestResult(`✅ Price exists: ${JSON.stringify(data, null, 2)}`);
            } else {
                setTestResult(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            setTestResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Stripe Price ID Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <strong>Current Price ID:</strong> {process.env.NEXT_PUBLIC_STRIPE_AUG31_4U_PRICE_ID}
                    </div>
                    <div>
                        <strong>Environment:</strong> {process.env.NODE_ENV}
                    </div>
                    <Button onClick={testStripePrice} disabled={loading}>
                        {loading ? 'Testing...' : 'Test Price ID'}
                    </Button>
                    {testResult && (
                        <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
                            {testResult}
                        </pre>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
