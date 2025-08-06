import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { surveyService, SurveyResponse } from "@/services/surveyService";
import Image from "next/image";

interface SurveyQuestion {
  id: number;
  question: string;
  options: string[];
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 1,
    question: "How often do you play?",
    options: ["New to Golf", "1 to 11 Rounds/Year", "12 to 24 Rounds/Year", "25+ Rounds/Year"]
  },
  {
    id: 2,
    question: "Typical 18 hole round duration?",
    options: ["Under 4 Hours", "4-4½ Hours", "4½-5 Hours", "5+ Hours"]
  },
  {
    id: 3,
    question: "Do you have a GHIN #?",
    options: ["Yes", "No"]
  }
];

export default function SurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [sessionId] = useState(() => {
    // Generate a more unique session ID with timestamp + random
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initSurvey = async () => {
      // Prevent multiple initializations
      if (responseId || isInitializing) return;
      
      setIsInitializing(true);
      try {
        const id = await surveyService.startSurvey(sessionId);
        if (id) {
          setResponseId(id);
        }
      } catch (error) {
        console.error('Failed to initialize survey:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initSurvey();
  }, [sessionId, responseId, isInitializing]);

  const handleAnswer = async (answer: string) => {
    if (typeof window.navigator.vibrate === "function") {
      window.navigator.vibrate(10);
    }

    const newAnswers = [...answers];
    newAnswers[currentStep - 1] = answer;
    setAnswers(newAnswers);

    if (responseId) {
      const updates: Partial<SurveyResponse> = {
        drop_off_step: currentStep + 1
      };
      switch(currentStep) {
        case 1: updates.question_1_answer = answer; break;
        case 2: updates.question_2_answer = answer; break;
        case 3: updates.question_3_answer = answer; break;
      }
      await surveyService.updateSurveyResponse(responseId, updates);
    }

    if (currentStep < surveyQuestions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleting(true);
      if (responseId) {
        await surveyService.completeSurvey(responseId);
      }
    }
  };

  const progressPercentage = (currentStep / surveyQuestions.length) * 100;

  if (isCompleting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-start justify-center pt-8 p-4">
        <Card className="w-full max-w-md mx-auto min-h-[600px]">
          <CardContent className="p-8 text-center space-y-6 flex flex-col justify-between min-h-[552px]">
            <div className="space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <Image
                  src="/full-4unders-logo-mddg489f.png"
                  alt="4Under Club Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-green-700">
                  Join Now and Play 4Points!
                </h1>
                <p className="text-gray-600">
                  Thank you for your interest! Get started now or sign in if you're already a member.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-full max-w-xs mx-auto">
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="aspect-square w-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center min-h-[120px]"
                >
                  Get Started
                </Button>
              </div>
              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="w-full text-lg py-3"
              >
                Member Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 0 && answers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-start justify-center pt-8 p-4">
        <Card className="w-full max-w-md mx-auto min-h-[600px]">
          <CardContent className="p-8 text-center space-y-6 flex flex-col justify-between min-h-[552px]">
            <div className="space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <Image
                  src="/full-4unders-logo-mddg489f.png"
                  alt="4Under Club Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-green-700">
                  Do you want to play golf in under 4 hours?
                </h1>
                <p className="text-lg text-gray-700">
                  The 4Under Club is open to anyone who wants to play 18 holes in under 4 hours ... or under 2 for 9 holes!
                </p>
                <p className="text-lg font-medium text-green-600">
                  What's our secret? Join us to find out.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setCurrentStep(1)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
              >
                Let's Get Started
              </Button>
              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="w-full text-lg py-3"
              >
                Member Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = surveyQuestions[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-start justify-center pt-8 p-4">
      <Card className="w-full max-w-md mx-auto min-h-[600px]">
        <CardContent className="p-6 space-y-6 flex flex-col justify-between min-h-[552px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <Progress value={progressPercentage} className="w-full h-2" />
              <p className="text-sm text-gray-500 text-center">
                Question {currentStep} of {surveyQuestions.length}
              </p>
            </div>

            <div className="relative w-24 h-24 mx-auto">
              <Image
                src="/full-4unders-logo-mddg489f.png"
                alt="4Under Club Logo"
                fill
                className="object-contain"
              />
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-gray-800">
                {currentQuestion.question}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isFrequencyQuestion = currentQuestion.id === 1;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 hover:shadow-lg border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 p-4 text-center"
                >
                  {isFrequencyQuestion ? (
                    <>
                      <span className="text-2xl font-bold text-green-600">
                        {option === "New to Golf" ? "New" : 
                         option === "1 to 11 Rounds/Year" ? "1-11" :
                         option === "12 to 24 Rounds/Year" ? "12-24" :
                         option === "25+ Rounds/Year" ? "25+" : option}
                      </span>
                      <span className="text-xs text-gray-600 mt-1">
                        {option === "New to Golf" ? "to Golf" : "Rounds/Year"}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-gray-800">
                      {option}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
