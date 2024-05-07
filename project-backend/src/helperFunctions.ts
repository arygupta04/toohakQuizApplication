// HELPER FUNCTIONS
import { DataStore, QuizSession } from './dataStore';
import randomatic from 'randomatic';
import crypto from 'crypto';

// Function that checks if a given session exists in a quiz
export function checkSessionExists(token: string, data: DataStore): number {
  let authUserId = 0;
  let sessionExists = false;

  // Loop through users to find the authUserId based on the provided token
  for (const user of data.users) {
    if (user.sessions.includes(token)) {
      sessionExists = true;
      break;
    }
    authUserId++;
  }

  // Check if session exists for the provided token
  if (sessionExists === false) {
    return -1;
  } else {
    return authUserId;
  }
}

// Error check for  quiz does not exist
// false: quiz does not exist
export function isQuizExist(data: DataStore, quizId: number): boolean {
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (quiz === undefined) {
    return false;
  }
  return true;
}

// Error check for quiz Owner
// false: authId is not Owner
export function isQuizOwner(data: DataStore, quizId: number, authUserId: number): boolean {
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (quiz.quizOwner !== authUserId) {
    return false;
  }

  return true;
}

// false: if not alphanumeric
export function isAlphanumeric(name: string): boolean {
  const invalidCharactersRegex = /[^a-zA-Z0-9' -]/;

  for (const letter of name) {
    if (letter !== ' ' && invalidCharactersRegex.test(letter)) {
      return false;
    }
  }
  return true;
}

// false: invalid length
export function isNameLenValid(name: string): boolean {
  if (name.length < 3 || name.length > 30) {
    return false;
  }
  return true;
}

// false: name repeated exist
export function isNameAlreadyExist(data: DataStore, name: string): boolean {
  for (const element of data.quizzes) {
    if (name === element.name) {
      return false;
    }
  }

  return true;
}

// false: question not found
export function findQuestionId(data: DataStore, quizId: number, questionId: number): boolean {
  const findQuestionId = data.quizzes[quizId].questions.find(question => question.questionId === questionId);
  if (findQuestionId === undefined) {
    return false;
  }

  return true;
}

// Function that checks if the length of a description string is valid
export function isDescriptionLenValid (description: string): boolean {
  if (description.length > 100) {
    return false;
  }
  return true;
}

// Function that generates a random player Id
export function generatePlayerId() : number {
  return Math.floor(Math.random() * 1000);
}

// Function that generates a random name
export function randomNameGenerator(): string {
  let name;
  do {
    name = generateUniqueName();
  } while (!isUnique(name));
  return name;
}

// Function that makes sure each character is unique and generates a name
function generateUniqueName(): string {
  const nameLength = 5;
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let name = '';
  for (let i = 0; i < nameLength; i++) {
    let char;
    do {
      char = chars.charAt(Math.floor(Math.random() * chars.length));
    } while (name.includes(char));
    name += char;
  }
  name += randomatic('0', 3);
  return name;
}

// Function to check if name is unique
function isUnique(name: string): boolean {
  const charSet = new Set(name);
  return charSet.size === name.length;
}

// Function that checks the validity of a url
export function isValidImageUrl(imgUrl: string): boolean {
  // Check if the image URL ends with jpg, jpeg, or png (case insensitive)
  const validExtensions: string[] = ['.jpg', '.jpeg', '.png'];
  // Check if the image URL starts with http:// or https://
  const validProtocols: string[] = ['http://', 'https://'];

  // Check if any of the valid extensions match the end of the URL
  const endsWithValidExtension: boolean = validExtensions.some(ext => imgUrl.toLowerCase().endsWith(ext));
  // Check if the URL starts with any of the valid protocols
  const startsWithValidProtocol: boolean = validProtocols.some(protocol => imgUrl.toLowerCase().startsWith(protocol));

  if (endsWithValidExtension === true && startsWithValidProtocol === true) {
    return true;
  }

  return false;
}

// Function that generates random token for session ID
export function generateTokenID() {
  return Math.floor(Math.random() * 1000000).toString();
}

// Function that encrypts a string
export function getHashOf(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

// Check if the email is unique in the data store
export function isEmailUnique(data: DataStore, email: string): boolean {
  return !data.users.some(user => user.email === email);
}

// Validate if the name only contains allowed characters
export function isNameValid(name: string): boolean {
  const allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ -'";
  for (const char of name) {
    if (!allowedChars.includes(char)) {
      return false;
    }
  }
  return true;
}

// Validate if the name length is longer
export function isNameLengthShort(name: string): boolean {
  return name.length >= 2;
}

// Validate if the name length is shorter
export function isNameLengthLong(name: string): boolean {
  return name.length <= 20;
}

// Function that checks the length of texts
export function checkTextLength(text: string, minLength: number, maxLength: number): boolean {
  return text.length > minLength && text.length < maxLength;
}

// // Function that checks if at least one correct answer is present
// export function hasCorrectAnswer(answers: Answer[]): boolean {
//   return answers.some(answer => answer.correct);
// }

// Function that checks for active sessions not in the 'END' state
export function isActiveSession(quizSessions: QuizSession[]): boolean {
  for (const session of quizSessions) {
    if (session.state !== 'END') {
      return true;
    }
  }
  return false;
}

// Function that generates an answerId
export function generateAnswerId() {
  return Math.floor(Math.random() * 1000000);
}

// Function that generates an quizId
export function generateQuizId() {
  return Math.floor(Math.random() * 1000000);
}

// Function that checks for duplciates
export function hasDuplicates(array: number[]): boolean {
  return array.some((value: number, index: number) => array.indexOf(value) !== index);
}

// Function that checks if player answer is correct
export function answersAreEqual(corrAnswers: number[], playerAnswers: number[]) {
  const sortedCorrAnswers = corrAnswers.slice().sort((a, b) => a - b);
  const sortedPlayerAnswers = playerAnswers.slice().sort((a, b) => a - b);

  return sortedCorrAnswers.every((value, index) => value === sortedPlayerAnswers[index]);
}
