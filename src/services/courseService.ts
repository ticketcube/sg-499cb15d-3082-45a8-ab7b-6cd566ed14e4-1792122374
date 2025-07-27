
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types";

export const courseService = {
  getAllCourses: async (): Promise<Course[]> => {
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        par,
        holes,
        course_tees!course_tees_course_id_fkey (
            id,
            name,
            color,
            slope_rating,
            course_rating
        )
      `);

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      throw coursesError;
    }

    return courses.map(course => ({
      id: course.id,
      name: course.name,
      par: course.par,
      holes: course.holes,
      tees: course.course_tees.map(tee => ({
        id: tee.id,
        name: tee.name,
        color: tee.color,
        slopeRating: Number(tee.slope_rating),
        courseRating: Number(tee.course_rating)
      }))
    }));
  },

  getCourseById: async (id: string): Promise<Course | undefined> => {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        par,
        holes,
        course_tees (
          id,
          name,
          color,
          slope_rating,
          course_rating
        )
      `)
      .eq("id", id)
      .single();

    if (courseError) {
      if (courseError.code === "PGRST116") {
        return undefined;
      }
      console.error("Error fetching course:", courseError);
      throw courseError;
    }

    return {
      id: course.id,
      name: course.name,
      par: course.par,
      holes: course.holes,
      tees: course.course_tees.map(tee => ({
        id: tee.id,
        name: tee.name,
        color: tee.color,
        slopeRating: Number(tee.slope_rating),
        courseRating: Number(tee.course_rating)
      }))
    };
  }
};
