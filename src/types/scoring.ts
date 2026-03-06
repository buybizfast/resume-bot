export interface ATSScoreResult {
  totalScore: number;
  breakdown: {
    keywordMatch: CategoryScore;
    sectionStructure: CategoryScore;
    formattingQuality: CategoryScore;
    experienceRelevance: CategoryScore;
    measurableImpact: CategoryScore;
    completeness: CategoryScore;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Suggestion[];
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  details: string[];
}

export interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  action: string;
}
