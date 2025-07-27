
import { supabase } from "@/integrations/supabase/client";

export interface SurveyResponse {
  id: string;
  session_id: string;
  user_id?: string;
  question_1_answer?: string;
  question_2_answer?: string;
  question_3_answer?: string;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  ip_address?: string;
  user_agent?: string;
  drop_off_step?: number;
}

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
    question_1: { [key: string]: number };
    question_2: { [key: string]: number };
    question_3: { [key: string]: number };
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

      return data?.setting_value === true;
    } catch (error) {
      console.error('Error checking survey status:', error);
      return false;
    }
  },

  async startSurvey(sessionId: string, userId?: string): Promise<string | null> {
    try {
      const insertData: any = {
        session_id: sessionId,
        drop_off_step: 1,
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

  async updateSurveyResponse(
    responseId: string, 
    updates: Partial<SurveyResponse>
  ): Promise<boolean> {
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
          drop_off_step: 4
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
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*');

      if (error) throw error;

      const total_started = responses.length;
      const total_completed = responses.filter((r: any) => r.completed).length;
      const completion_rate = total_started > 0 ? (total_completed / total_started) * 100 : 0;

      // Calculate drop-off rates
      const dropOffCounts = {
        question_1: responses.filter((r: any) => r.drop_off_step === 1).length,
        question_2: responses.filter((r: any) => r.drop_off_step === 2).length,
        question_3: responses.filter((r: any) => r.drop_off_step === 3).length,
        completed: responses.filter((r: any) => r.drop_off_step === 4).length,
      };

      const drop_off_rates = {
        question_1: total_started > 0 ? (dropOffCounts.question_1 / total_started) * 100 : 0,
        question_2: total_started > 0 ? (dropOffCounts.question_2 / total_started) * 100 : 0,
        question_3: total_started > 0 ? (dropOffCounts.question_3 / total_started) * 100 : 0,
        completed: total_started > 0 ? (dropOffCounts.completed / total_started) * 100 : 0,
      };

      // Count responses by answer
      const responses_by_answer: SurveyAnalytics['responses_by_answer'] = {
        question_1: {},
        question_2: {},
        question_3: {},
      };

      responses.forEach((response: any) => {
        if (response.question_1_answer) {
          responses_by_answer.question_1[response.question_1_answer] = 
            (responses_by_answer.question_1[response.question_1_answer] || 0) + 1;
        }
        if (response.question_2_answer) {
          responses_by_answer.question_2[response.question_2_answer] = 
            (responses_by_answer.question_2[response.question_2_answer] || 0) + 1;
        }
        if (response.question_3_answer) {
          responses_by_answer.question_3[response.question_3_answer] = 
            (responses_by_answer.question_3[response.question_3_answer] || 0) + 1;
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
        .select('*')
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
