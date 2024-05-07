// YOU SHOULD MODIFY THIS OBJECT BELOW ONLY
let data : DataStore = {
  users: [],
  quizzes: [],
};

export interface DataStore {
  users: User[];
  quizzes: Quiz[];
}

export interface User {
  email: string;
  password: string;
  name: string;
  authUserId: number;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  passwordHistory?: string[];
  sessions: string[];
  quizTrash: Quiz[];
}

export interface Quiz {
  quizId: number;
  quizOwner: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  questions?: Question[];
  thumbnailUrl?: string;
  activeQuizSessions?: QuizSession[];
  inactiveQuizSessions?: QuizSession[];
  activeSessionIds?: number[];
  inactiveSessionIds?: number[];
}

export interface ViewSessionsReturnObject {
  activeSessions: number[],
  inactiveSessions: number[],
}
export interface QuizSession {
  sessionId: number;
  quizOwner: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  questions: QuestionResult[];
  thumbnailUrl: string;
  state: string;
  guests: Player[];
  message: MessageBody[];
  autoStartNum: number;
  atQuestion: number;
}

export interface Question {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: Answer[];

  thumbnailUrl: string;
}

export interface QuestionCreate {
  questionId: number,
  question: string,
  duration: number,
  points: number,
  answers: Answer[],
  timeLastEdited?: number,
  thumbnailUrl: string
}

export interface QuestionBody {
  question: string;
  duration: number;
  points: number;
  answers: AnswerBody[];

  // answers: AnswerBodyInput[];
  thumbnailUrl: string;
}
// export interface AnswerBodyInput {
//   answer: string;
//   correct: boolean;
// }
export interface Answer {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface QuestionResult {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: Answer[];
  thumbnailUrl: string;
  corrAnsIds: number[];
  currCorrAnsRank: number;
  playerResults: PlayerResult[];
  timeQuestionOpen: number;
}

export interface AnswerBody {
  answer: string;
  correct: boolean;
  colour?: string;
  answerId?: number;
}

export interface Player {
  playerId: number;
  playerName: string;
  totalScore?: number;
}

export interface UserRankedByScrore {
  name: string;
  score: number;
}

export interface PlayerResult {
  playerId: number;
  playerName: string;
  playerAnswer: number[];
  isItCorrect: boolean;
  corrAnsRank: number;
  score: number;
  timeTaken: number;
}

export interface RegisterUserPush {
  email: string;
  password: string;
  name: string;
  authUserId: number;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  sessions: string[];
  quizTrash: Quiz[];
}

export interface MessageBody {
  message: string;
  playerId: number;
  playerName: string;
  timeSent: number;
}

export interface UserDetailsResponse {
  user: {
    userId: number;
    name: string;
    email: string;
    numSuccessfulLogins: number;
    numFailedPasswordsSinceLastLogin: number;
  }
}

export interface QuizInfoObject {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[];
  duration: number;
  thumbnailUrl: string;
}

export interface QuizStatusInfoObject {
  state: string;
  atQuestion: number;
  players: string[];

  metadata: QuizInfoObject | { error?: string };
}

export interface PlayerStatusInfoObject {
  state: string;
  numQuestion: number;
  atQuestion: number;
}

export interface QuestionResultResponse {
  questionId: number;
  playersCorrectList: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export interface UserScore {
  name: string;
  score: number;
}

export interface QuizSessionFinalResults {
  usersRankedByScore: UserScore[];
  questionResults: QuestionResultResponse[];
}

export interface QuizSessionFinalResultsCSV {
  url: string;
}

export interface QuizTimeoutMap {
  [sessionId: number]: {

    toQUESTION_OPENTimeoutId?: ReturnType<typeof setTimeout>;
    toQUESTION_CLOSETimeoutId?: ReturnType<typeof setTimeout>;
  };
}
export const quizTimeoutMap: QuizTimeoutMap = {};

function getData(): DataStore {
  return data;
}

function setData(newData: DataStore) {
  data = newData;
}

export { getData, setData };
