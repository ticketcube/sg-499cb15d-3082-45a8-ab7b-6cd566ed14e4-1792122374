import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Brain, Dumbbell, Heart, ArrowRight, Play } from "lucide-react";

export default function MVGPage() {
  const disciplines = {
    physical: [
      { title: "The Golf Swing", videoId: "v2WvIdSNGW8", description: "Mastering the fundamental motion" },
      { title: "Putting", videoId: "67WI2Ok50s8", description: "The art of reading greens and rolling true" },
      { title: "Equipment", videoId: "dUoh5iOZHxM", description: "Choosing tools that fit your game" }
    ],
    mental: [
      { title: "Continuous Learning", videoId: "iTDsyxb_X7c", description: "Always improving, always growing" },
      { title: "Shot Selection", videoId: "w-JuaFA99Ds", description: "Making smart decisions on course" },
      { title: "Game/Match Selection", videoId: "pa063WsJWeY", description: "Finding formats that maximize fun and competition" }
    ],
    emotional: [
      { title: "Respect", videoId: "byjHwob-3Ls", description: "For the game, the course, and your playing partners" },
      { title: "Patience", videoId: "I8Mr5GMLlQ4", description: "Accepting the journey and the process" },
      { title: "Joy", videoId: "ypZZ2ByO0t8", description: "Finding happiness in every round" }
    ]
  };

  return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-block">
              <div className="relative">
                <img 
                  src="/mvg.jpg" 
                  alt="Minimum Viable Golf" 
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary"
                />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary">
              Minimum Viable Golf
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A golf philosophy inspired by Silicon Valley's most powerful strategy: 
              build the minimum that's actually viable, then iterate.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/game">
                <Button size="lg" className="gap-2">
                  Play 4Points <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="https://minimumviablegolf.substack.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  Read the Philosophy <Play className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
        </section>

     

        {/* Nine Disciplines */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Nine Disciplines for Better Golf</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                MVG organizes golf mastery into three branches: Physical, Mental, and Emotional. 
                Master these nine disciplines and watch your game transform.
              </p>
            </div>

            <Tabs defaultValue="physical" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="physical" className="gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Physical
                </TabsTrigger>
                <TabsTrigger value="mental" className="gap-2">
                  <Brain className="w-4 h-4" />
                  Mental
                </TabsTrigger>
                <TabsTrigger value="emotional" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Emotional
                </TabsTrigger>
              </TabsList>

              <TabsContent value="physical" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {disciplines.physical.map((discipline, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{discipline.title}</CardTitle>
                        <CardDescription>{discipline.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${discipline.videoId}`}
                            title={discipline.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="mental" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {disciplines.mental.map((discipline, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{discipline.title}</CardTitle>
                        <CardDescription>{discipline.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${discipline.videoId}`}
                            title={discipline.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* 4Points Callout */}
                <Card className="bg-primary/5 border-primary/20 border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <ArrowRight className="w-6 h-6 text-primary" />
                      Game/Match Selection in Action: 4Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg">
                      <span className="font-semibold">4Points</span> is the perfect example of MVG's Mental Discipline #2 in action. 
                      Instead of traditional stroke play that can drag on for hours, 4Points offers:
                    </p>
                    <ul className="space-y-2 ml-6">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>Faster rounds (under 3 hours)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>More competitive and engaging scoring</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>Better feedback on your performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>A format that works for all skill levels</span>
                      </li>
                    </ul>
                    <div className="pt-4">
                      <Link href="/game">
                        <Button size="lg" className="gap-2">
                          Try 4Points Now <ArrowRight className="w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emotional" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {disciplines.emotional.map((discipline, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{discipline.title}</CardTitle>
                        <CardDescription>{discipline.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${discipline.videoId}`}
                            title={discipline.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Introduction Video */}
        <section className="py-16 px-4 bg-card/50">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">What is Minimum Viable Golf?</h2>
            <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/2jDmcyRrsh8"
                title="What is Minimum Viable Golf?"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Game?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start with the minimum that's viable. Try 4Points—the faster, more competitive way to play golf.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/game">
                <Button size="lg" className="gap-2">
                  Play Your First 4Points Round <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="https://www.youtube.com/@minimumviablegolf" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  Watch More Videos <Play className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      </div>
  );
}