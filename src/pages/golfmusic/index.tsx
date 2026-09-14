import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import Head from "next/head";

// Configuration - Update this with your actual Google Calendar booking URL
const GOLFMUSIC_BOOKING_URL = "https://calendar.app.google/zTouQsuJgi3aqgpL7";

// Placeholder episode data
const episodes = [
  {
    id: 1,
    thumbnailUrl: "https://img.youtube.com/vi/2jDmcyRrsh8/maxresdefault.jpg",
    guestName: "Pat Monahan",
    guestDescription: "Lead Singer, Train",
    title: "Pat Monahan on Golf, Music & the Perfect Foursome",
    description: "The Grammy-winning musician talks about finding rhythm on the course and harmony in life.",
    youtubeUrl: "https://www.youtube.com/watch?v=2jDmcyRrsh8",
    duration: "15:32",
    category: "BOTH" as const
  },
  {
    id: 2,
    thumbnailUrl: "https://img.youtube.com/vi/v2WvIdSNGW8/maxresdefault.jpg",
    guestName: "Sarah Jenkins",
    guestDescription: "LPGA Pro",
    title: "Sarah Jenkins on Pre-Round Playlists and Mental Preparation",
    description: "How music shapes her tournament preparation and course strategy.",
    youtubeUrl: "https://www.youtube.com/watch?v=v2WvIdSNGW8",
    duration: "14:45",
    category: "GOLFER" as const
  },
  {
    id: 3,
    thumbnailUrl: "https://img.youtube.com/vi/67WI2Ok50s8/maxresdefault.jpg",
    guestName: "Marcus Washington",
    guestDescription: "Jazz Saxophonist",
    title: "Marcus Washington on Improvisation, Feel, and the Perfect Swing",
    description: "Finding the parallels between jazz improvisation and reading greens.",
    youtubeUrl: "https://www.youtube.com/watch?v=67WI2Ok50s8",
    duration: "16:12",
    category: "MUSICIAN" as const
  }
];

const signatureQuestions = [
  "If your golf game were a song, what song would it be?",
  "Who is in your ultimate golf + music foursome?",
  "What's your golf walk-up song?",
  "What's harder: playing a perfect round or playing a perfect show?",
  "What's the best golf course you've ever played?",
  "What musician would make the best golfer?",
  "What golfer would make the best musician?"
];

export default function GolfMusicPage() {
  const scrollToEpisodes = () => {
    document.getElementById('episodes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>GolfMusic | Golfers Who Love Music. Musicians Who Love Golf. | Minimum Viable Golf</title>
        <meta 
          name="description" 
          content="GolfMusic by Minimum Viable Golf explores the intersection of golf and music through short conversations with golfers, musicians and people who love both." 
        />
        <meta name="keywords" content="golf music, golf and music, musicians who golf, golfers who love music, golf podcast, music podcast, golf interviews, musician golfers, golf culture, Minimum Viable Golf" />
        
        {/* Open Graph */}
        <meta property="og:title" content="GolfMusic | Golfers Who Love Music. Musicians Who Love Golf." />
        <meta property="og:description" content="GolfMusic by Minimum Viable Golf explores the intersection of golf and music through short conversations with golfers, musicians and people who love both." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvg.golf/golfmusic" />
        <meta property="og:image" content="https://mvg.golf/golfmusic.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GolfMusic | Golfers Who Love Music. Musicians Who Love Golf." />
        <meta name="twitter:description" content="GolfMusic by Minimum Viable Golf explores the intersection of golf and music through short conversations with golfers, musicians and people who love both." />
        <meta name="twitter:image" content="https://mvg.golf/golfmusic.png" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 px-4 bg-black text-white">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-8 tracking-tight">
              GOLFMUSIC
                      </h1>
                      <div className="flex-shrink-0">
                          <Image
                              src="/GMMG.jpeg"
                              alt="Four Under Club"
                              width={120}
                              height={185}
                              priority
                              className="
            w-[100px]
            md:w-[120px]
            h-auto
            object-contain
          "
                          />
                      </div>
            
            <p className="text-3xl md:text-4xl font-light mb-4 tracking-wide">
              Golfers Who Love Music.
              <br />
              Musicians Who Love Golf.
            </p>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
              A new Minimum Viable Golf series exploring the weird, funny and surprisingly deep connection between golf and music.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href={GOLFMUSIC_BOOKING_URL} target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  SCHEDULE A CHAT
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              
              
            </div>
          </div>
        </section>

        {/* The Concept Section */}
        <section className="py-20 md:py-28 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-12 text-center">
              WHY GOLF + MUSIC?
            </h2>
            
            <div className="space-y-6 text-xl md:text-2xl leading-relaxed text-gray-700">
              <p className="text-center">
                Golf and music have more in common than they probably should.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 py-8">
                <div className="space-y-3">
                  <p className="font-semibold">Both are obsessive.</p>
                  <p className="font-semibold">Both are endlessly repeatable.</p>
                  <p className="font-semibold">Both have rituals.</p>
                </div>
                <div className="space-y-3">
                  <p className="font-semibold">Both require feel.</p>
                  <p className="font-semibold">Both create incredibly strong communities.</p>
                </div>
              </div>
              
              <p className="text-center text-2xl md:text-3xl font-light pt-6">
                GolfMusic explores the people who live somewhere in between.
              </p>
            </div>
          </div>
        </section>

        {/* The Format Section */}
        <section className="py-20 md:py-28 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-center">
              15 MINUTES.
            </h2>
            <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">
              ONE CONVERSATION.
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 border-black">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-bold mb-6">TALK</h3>
                  <div className="space-y-4 text-lg text-gray-700">
                    <p>No script.</p>
                    <p>No preparation.</p>
                    <p>Just a conversation about golf, music and whatever happens in between.</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-black">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-bold mb-6">YOU CONTROL IT</h3>
                  <div className="space-y-4 text-lg text-gray-700">
                    <p>Video.</p>
                    <p>Audio.</p>
                    <p>Or just a conversation.</p>
                    <p className="pt-2 font-semibold">The guest decides what gets recorded.</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-black">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-bold mb-6">SEE WHERE IT GOES</h3>
                  <div className="space-y-4 text-lg text-gray-700">
                    <p>If we get something interesting, it can become a GolfMusic episode.</p>
                    <p className="pt-2 font-semibold">No pressure.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* The Questions Section */}
        <section className="py-20 md:py-28 px-4 bg-black text-white">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">
              CONVERSATION CARDS
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {signatureQuestions.map((question, idx) => (
                <div 
                  key={idx}
                  className="border-2 border-white p-6 md:p-8 rounded-lg hover:bg-white hover:text-black transition-colors duration-300"
                >
                  <p className="text-xl md:text-2xl font-light leading-relaxed">
                    "{question}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-28 px-4 bg-green-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              LET'S TALK.
            </h2>
            
            <div className="space-y-4 text-xl md:text-2xl mb-12 leading-relaxed">
              <p>Got a golf story?</p>
              <p>Got a music story?</p>
              <p className="font-semibold">Got both?</p>
              
              <p className="pt-6">
                Let's spend 15 minutes talking about it.
              </p>
              
              <div className="space-y-2 pt-4">
                <p className="font-semibold">You choose:</p>
                <p className="text-3xl">VIDEO OR AUDIO.</p>
              </div>
              
              <p className="pt-4 text-lg">
                You control what's recorded.
              </p>
            </div>
            
            <a href={GOLFMUSIC_BOOKING_URL} target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-black hover:bg-gray-900 text-white font-semibold"
              >
                SCHEDULE A CHAT
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </section>

        {/* YouTube Section */}
        <section className="py-20 md:py-28 px-4 bg-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              MORE FROM MINIMUM VIABLE GOLF
            </h3>
            
            <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              GolfMusic is part of Minimum Viable Golf — a philosophy for golfers.
            </p>
            
            <a href="https://www.youtube.com/@minimumviablegolf" target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-black text-black hover:bg-black hover:text-white font-semibold"
              >
                WATCH ON YOUTUBE
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-4 bg-black text-white">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-4">
                <h4 className="text-2xl font-bold">MINIMUM VIABLE GOLF</h4>
                <p className="text-3xl md:text-4xl font-bold">GOLFMUSIC</p>
                <p className="text-lg text-gray-300">
                  Golfers Who Love Music.
                  <br />
                  Musicians Who Love Golf.
                </p>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-bold mb-4">LINKS</h4>
                <div className="space-y-2">
                  <div>
                    <a 
                      href="https://www.youtube.com/@minimumviablegolf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      YouTube
                    </a>
                  </div>
                 
                  <div>
                    <a 
                      href={GOLFMUSIC_BOOKING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors font-semibold"
                    >
                      Schedule a Chat
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
              <p>© {new Date().getFullYear()} Minimum Viable Golf. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}