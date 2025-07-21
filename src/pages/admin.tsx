
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { surveyService, SurveyAnalytics, SurveyResponse } from "@/services/surveyService";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [surveyEnabled, setSurveyEnabled] = useState(false);
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.email !== 'alan@alanrakov.com')) {
      router.push('/auth/login');
      return;
    }

    if (user && user.email === 'alan@alanrakov.com') {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [enabled, analyticsData, responsesData] = await Promise.all([
        surveyService.isSurveyEnabled(),
        surveyService.getSurveyAnalytics(),
        surveyService.getAllResponses()
      ]);
      
      setSurveyEnabled(enabled);
      setAnalytics(analyticsData);
      setResponses(responsesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load admin data'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleSurvey = async (enabled: boolean) => {
    try {
      const success = await surveyService.toggleSurvey(enabled);
      if (success) {
        setSurveyEnabled(enabled);
        toast({
          title: 'Success',
          description: `Survey ${enabled ? 'enabled' : 'disabled'} successfully`
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to toggle survey'
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Started At', 'Completed', 'Q1 Answer', 'Q2 Answer', 'Q3 Answer', 'Drop Off Step'].join(','),
      ...responses.map(r => [
        r.id,
        r.started_at,
        r.completed,
        r.question_1_answer || '',
        r.question_2_answer || '',
        r.question_3_answer || '',
        r.drop_off_step || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!user || user.email !== 'alan@alanrakov.com') {
    return null;
  }

  const dropOffData = analytics ? [
    { name: 'Question 1', value: analytics.drop_off_rates.question_1 },
    { name: 'Question 2', value: analytics.drop_off_rates.question_2 },
    { name: 'Question 3', value: analytics.drop_off_rates.question_3 },
    { name: 'Completed', value: analytics.drop_off_rates.completed }
  ] : [];

  const q1Data = analytics ? Object.entries(analytics.responses_by_answer.question_1).map(([key, value]) => ({
    name: key,
    value
  })) : [];

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Survey Admin</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Survey Status:</span>
            <Switch
              checked={surveyEnabled}
              onCheckedChange={handleToggleSurvey}
            />
            <Badge variant={surveyEnabled ? "default" : "secondary"}>
              {surveyEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_started}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.completion_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={exportData} variant="outline" size="sm">
                  Export CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Drop-off Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dropOffData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Drop-off Rate']} />
                      <Bar dataKey="value" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How Often Do You Play?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={q1Data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {q1Data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <CardTitle>Survey Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Started</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Q1: How Often</TableHead>
                      <TableHead>Q2: Duration</TableHead>
                      <TableHead>Q3: GHIN</TableHead>
                      <TableHead>Drop-off</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          {new Date(response.started_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={response.completed ? "default" : "secondary"}>
                            {response.completed ? "Completed" : "Incomplete"}
                          </Badge>
                        </TableCell>
                        <TableCell>{response.question_1_answer || "-"}</TableCell>
                        <TableCell>{response.question_2_answer || "-"}</TableCell>
                        <TableCell>{response.question_3_answer || "-"}</TableCell>
                        <TableCell>Step {response.drop_off_step}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
