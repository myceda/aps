import {
  demoCourses,
  demoPrerequisites,
  demoPrograms,
  demoStructures,
  demoStudyPlan,
  demoTranscriptCourses,
  demoTranscriptSummaries
} from "@/data/demo-data";

export const repository = {
  getPrograms() {
    return demoPrograms;
  },
  getCourses() {
    return demoCourses;
  },
  getStructures() {
    return demoStructures;
  },
  getStudyPlan() {
    return demoStudyPlan;
  },
  getPrerequisites() {
    return demoPrerequisites;
  },
  getTranscriptCourses() {
    return demoTranscriptCourses;
  },
  getTranscriptSummaries() {
    return demoTranscriptSummaries;
  }
};
