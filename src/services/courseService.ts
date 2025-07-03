
import { Course } from "@/types";

const defaultCourses: Course[] = [
  {
    id: "rancho-park",
    name: "Rancho Park Golf Course",
    par: 72,
    holes: 18,
    tees: [
      {
        id: "blue",
        name: "Blue",
        color: "blue",
        slopeRating: 121,
        courseRating: 71.2
      },
      {
        id: "white",
        name: "White",
        color: "white",
        slopeRating: 119,
        courseRating: 70.1
      }
    ]
  },
  {
    id: "penmar",
    name: "Penmar Golf Course",
    par: 33,
    holes: 9,
    tees: [
      {
        id: "white",
        name: "White",
        color: "white",
        slopeRating: 113,
        courseRating: 31.5
      }
    ]
  }
];

export const courseService = {
  getAllCourses: async (): Promise<Course[]> => {
    return defaultCourses;
  },

  getCourseById: async (id: string): Promise<Course | undefined> => {
    return defaultCourses.find(course => course.id === id);
  }
};
