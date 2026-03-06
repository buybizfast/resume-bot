export interface ParsedJobDescription {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  allKeywords: string[];
  rawText: string;
}
