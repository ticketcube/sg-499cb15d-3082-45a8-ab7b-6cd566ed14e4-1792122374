
import { supabase } from "@/integrations/supabase/client";

// Constants
const SURVEY_STEPS = {
  QUESTION_1: 1,
  QUESTION_2: 2,
  QUESTION_3: 3,
  COMPLETED: 4
} as const;

type SurveyResponseBase = {
  id: string;
  session_id: string;
  user_id?: string;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  ip_address?: string;
  user_agent?: string;
  drop_off_step?: number;
};

type SurveyAnswers = {
  question_1_answer?: string;
  question_2_answer?: string;
  question_3_answer?: string;
};

export type SurveyResponse = SurveyResponseBase & SurveyAnswers;

export type SurveyUpdatePayload = {
  question_1_answer?: string;
  question_2_answer?: string;
  question_3_answer?: string;
  drop_off_step?: number;
};

export interface SurveyAnalytics {
  total_started: number;
  total_completed: number;
  completion_rate: number;
  drop_off_rates: {
    question_1: number;
    question_2: number;
    question_3: number;
    completed: number;
  };
  responses_by_answer: {
    question_1: Record<string, number>;
    question_2: Record<string, number>;
    question_3: Record<string, number>;
  };
}

export const surveyService = {
  async checkIfSurveyCompleted(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', userId)
        .eq('completed', true)
        .limit(1);

      if (error) {
        console.error('Error checking survey completion status:', error);
        return false;
      }

      return data !== null && data.length > 0;
    } catch (error) {
      console.error('Error in checkIfSurveyCompleted:', error);
      return false;
    }
  },

  async isSurveyEnabled(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'survey_enabled')
        .single();

      if (error) {
        console.error('Error checking survey status:', error);
        return false;
      }

      // Normalize boolean value
      const settingValue = data?.setting_value;
      return settingValue === true || settingValue === 'true' || settingValue === 1;
    } catch (error) {
      console.error('Error checking survey status:', error);
      return false;
    }
  },

  async startSurvey(sessionId: string, userId?: string): Promise<string | null> {
    try {
      // Check for duplicate session_id
      const { data: existingSession, error: checkError } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('session_id', sessionId)
        .limit(1);

      if (checkError) {
        console.error('Error checking for duplicate session:', checkError);
        return null;
      }

      if (existingSession && existingSession.length > 0) {
        console.warn('Session ID already exists:', sessionId);
        return existingSession[0].id;
      }

      const insertData: {
        session_id: string;
        started_at: string;
        drop_off_step: number;
        user_agent: string | null;
        user_id?: string;
      } = {
        session_id: sessionId,
        started_at: new Date().toISOString(),
        drop_off_step: SURVEY_STEPS.QUESTION_1,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      };

      if (userId) {
        insertData.user_id = userId;
      }

      const { data, error } = await supabase
        .from('survey_responses')
        .insert([insertData])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error starting survey:', error);
      return null;
    }
  },

  async updateSurveyResponse(responseId: string, updates: SurveyUpdatePayload): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('survey_responses')
        .update(updates)
        .eq('id', responseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating survey response:', error);
      return false;
    }
  },

  async completeSurvey(responseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('survey_responses')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          drop_off_step: SURVEY_STEPS.COMPLETED
        })
        .eq('id', responseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error completing survey:', error);
      return false;
    }
  },

  async getSurveyAnalytics(): Promise<SurveyAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('completed, drop_off_step, question_1_answer, question_2_answer, question_3_answer');

      if (error) throw error;
      
      if (!data) {
        return null;
      }
      const responses: SurveyResponse[] = data;

      const total_started = responses.length;
      const total_completed = responses.filter((r) => r.completed).length;
      const completion_rate = total_started > 0 ? (total_completed / total_started) * 100 : 0;

      const dropOffCounts = {
        question_1: responses.filter((r) => r.drop_off_step === SURVEY_STEPS.QUESTION_1 && !r.completed).length,
        question_2: responses.filter((r) => r.drop_off_step === SURVEY_STEPS.QUESTION_2 && !r.completed).length,
        question_3: responses.filter((r) => r.drop_off_step === SURVEY_STEPS.QUESTION_3 && !r.completed).length,
        completed: total_completed,
      };

      const drop_off_rates = {
        question_1: total_started > 0 ? (dropOffCounts.question_1 / total_started) * 100 : 0,
        question_2: total_started > 0 ? (dropOffCounts.question_2 / total_started) * 100 : 0,
        question_3: total_started > 0 ? (dropOffCounts.question_3 / total_started) * 100 : 0,
        completed: total_started > 0 ? (dropOffCounts.completed / total_started) * 100 : 0,
      };

      const responses_by_answer = {
        question_1: {} as Record<string, number>,
        question_2: {} as Record<string, number>,
        question_3: {} as Record<string, number>,
      };

      responses.forEach((response) => {
        // Cast answers to string to ensure proper type handling
        if (response.question_1_answer) {
          const answer = String(response.question_1_answer);
          responses_by_answer.question_1[answer] = 
            (responses_by_answer.question_1[answer] || 0) + 1;
        }
        if (response.question_2_answer) {
          const answer = String(response.question_2_answer);
          responses_by_answer.question_2[answer] = 
            (responses_by_answer.question_2[answer] || 0) + 1;
        }
        if (response.question_3_answer) {
          const answer = String(response.question_3_answer);
          responses_by_answer.question_3[answer] = 
            (responses_by_answer.question_3[answer] || 0) + 1;
        }
      });

      return {
        total_started,
        total_completed,
        completion_rate,
        drop_off_rates,
        responses_by_answer
      };
    } catch (error) {
      console.error('Error getting survey analytics:', error);
      return null;
    }
  },

  async getAllResponses(): Promise<SurveyResponse[]> {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('id, session_id, user_id, completed, started_at, completed_at, drop_off_step, question_1_answer, question_2_answer, question_3_answer')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting survey responses:', error);
      return [];
    }
  },

  async toggleSurvey(enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'survey_enabled',
          setting_value: enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling survey:', error);
      return false;
    }
  }
};

export default surveyService;
