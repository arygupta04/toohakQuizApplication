import {
  getData, setData, QuizStatusInfoObject, DataStore, Quiz, PlayerStatusInfoObject, QuestionBody,
  QuestionResultResponse, MessageBody, quizTimeoutMap, QuizSessionFinalResultsCSV, QuizSessionFinalResults,
  QuestionCreate, QuizInfoObject, ViewSessionsReturnObject, User
} from './dataStore';
// import unixTimestamp from 'unix-timestamp';
import {
  checkSessionExists, isQuizExist, isQuizOwner, isAlphanumeric, isNameLenValid, isNameAlreadyExist,
  findQuestionId, isDescriptionLenValid, generatePlayerId, randomNameGenerator, isValidImageUrl,
  checkTextLength, isActiveSession, generateAnswerId, hasDuplicates, answersAreEqual, generateQuizId
} from './helperFunctions';
import HTTPError from 'http-errors';

/**
  * Function that provides a list of all quizzes that are owned by the currently logged in user
  *
  * @param {string} token - The unique ID of a user.
  *
  * @returns {object} - If there are no errors
  * @returns {401, 'The following token does not exists'} - If the token does not exist in the session
*/
export function adminQuizList(token: string): { quizzes: Array<{ quizId: number; name: string }> } {
  // Gets the data
  const data: DataStore = getData();

  const authUserId = checkSessionExists(token, data);

  // Throws an error if the token does not exist in any session
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  const userQuizzes = [];

  // Loops through the list of quizzes and pushes the quizzes that belongs to the user if the session exists
  for (const quiz of data.quizzes) {
    if (authUserId === quiz.quizOwner) {
      userQuizzes.push({
        quizId: quiz.quizId,
        name: quiz.name
      });
    }
  }

  // Returns the user's list of quizzes
  return { quizzes: userQuizzes };
}

/**
 * Creates a new quiz for the logged-in user based on provided details.
 *
 * @param {string} token - The authentication token of the logged-in user.
 * @param {string} name - The name of the new quiz.
 * @param {string} description - The description of the new quiz.
 *
 * @returns {object} - Returns an object containing the quizId if successful.
 * @returns {object} - Returns an object with an error message if any error occurs:
 *                    { error: 'The following token does not exist.' } - If the provided token does not match any session.
 *                    { error: 'The name length is invalid.' } - If the length of the name is less than 3 or greater than 30 characters.
 *                    { error: 'The name contains invalid characters.' } - If the name contains non-alphanumeric characters.
 *                    { error: 'Quiz with the same name already exists.' } - If a quiz with the same name already exists.
 *                    { error: 'Description is too long.' } - If the length of the description exceeds 100 characters.
 */
export function adminQuizCreate (token: string, name: string, description: string): {quizId : number} | { error?: string } {
  // Fetch the data
  const data = getData();

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists.');
  }

  // Checks if name has correct length
  if (!isNameLenValid(name)) {
    throw HTTPError(400, 'The name length is invalid');
  }

  // Check for invalid characters in the name
  if (!isAlphanumeric(name)) {
    throw HTTPError(400, 'The name contains invalid characters');
  }

  // Check if name already exists
  const existingQuiz = data.quizzes.filter(quiz =>
    quiz.quizOwner === authUserId).find(
    element => name === element.name);

  if (existingQuiz) {
    throw HTTPError(400, 'Quiz with the same name already exists');
  }

  // Check if description length is valid
  if (!isDescriptionLenValid(description)) {
    throw HTTPError(400, 'Description is too long');
  }

  const quizId = generateQuizId();
  // Push the changes onto the data object
  const quiz : Quiz = {
    quizId: quizId,
    quizOwner: authUserId,
    name: name,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    description: description
  };

  data.quizzes.push(quiz);

  // Update the changes
  setData(data);

  // Returns the quizId
  return {
    quizId: quizId
  };
}

/**
  * Function that given a particular quiz, sends the quiz to trash (can be recovered later). When this route is called, the timeLastEdited is updated
  *
  * @param {integer} quizId - The unique ID of a quiz
  * @param {string} token - Contains the unique sessionId of a user's login session
  * ...
  *
  * @returns {} - If there are no errors
  * @returns {object}
  * Returns an error message string if :
  * - Token is empty or invalid (does not refer to valid logged in user session)
  * - Valid token is provided, but user is not an owner of this quiz
  * - Any session for this quiz is not in END state
*/

export function adminQuizRemove(quizId: number, token: string) {
  const data = getData();

  let user;
  let userIndexCounter = 0;
  let userIndex = -1;

  for (const dataUser of data.users) {
    if (dataUser.sessions.includes(token)) {
      user = dataUser;
      userIndex = userIndexCounter;
      break;
    }
    userIndexCounter++;
  }

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    return {
      error: 'Token is empty or invalid (does not refer to valid logged in user session'
    };
  }

  let quizIdCounter = 0;
  let quizIndex = -1;

  for (const dataQuiz of data.quizzes) {
    if (dataQuiz.quizId === quizId) {
      if (dataQuiz.quizOwner === user.authUserId) {
        quizIndex = quizIdCounter;
      }
      break;
    }
    quizIdCounter++;
  }

  if (!isQuizOwner(data, quizId, authUserId)) {
    return {
      error: 'Valid token is provided, but user is not an owner of this quiz'
    };
  }

  // if trash array doesn't exist, create it
  if (!data.users[userIndex].quizTrash) {
    data.users[userIndex].quizTrash = [];
  }
  // send quiz to trash
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  data.users[userIndex].quizTrash.push(data.quizzes[quizIndex]);
  data.quizzes.splice(quizIndex, 1);

  setData(data);

  return {};
}

/**
 * Retrieves detailed information about a specific quiz owned by the currently logged-in user.
 *
 * @param {string} token - The authentication token of the logged-in user.
 * @param {number} quizId - The unique ID of the quiz to retrieve information for.
 * @returns {object} - On success, returns an object containing detailed information about the quiz, including its questions and their answers. On failure, returns an object with an error message.
 * @returns {object} - Possible error messages:
 *                    { error: 'The following token does not exists' } - If the provided token does not match any session.
 *                    { error: 'QuizId does not refer to a quiz that this user owns' } - If the quizId does not refer to a quiz owned by the user.
 */
export function adminQuizInfo(token: string, quizId: number): { error?: string } | QuizInfoObject {
  const data = getData(); // Retrieve the current state of data, including users and quizzes

  const authUserId = checkSessionExists(token, data);
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  // Next, find the quiz by its ID and validate its ownership
  const quiz = data.quizzes.find(q => q.quizId === quizId && q.quizOwner === authUserId);

  if (!quiz) { // If the quiz is not found or not owned by the user, return an error
    throw HTTPError('QuizId does not refer to a quiz that this user owns');
  }

  const formattedQuestions = []; // Initialize an array to hold formatted questions
  let totalDuration = 0; // Initialize a variable to calculate the total duration of the quiz

  // Loop through each question in the quiz to format and include it
  for (let i = 0; i < (quiz.questions || []).length; i++) {
    const question = quiz.questions[i];
    totalDuration += question.duration; // Accumulate the total duration of the quiz

    const formattedAnswers = []; // Initialize an array to hold formatted answers for the current question
    // Loop through each answer to format and include it
    for (let j = 0; j < (question.answers || []).length; j++) {
      const answer = question.answers[j];
      formattedAnswers.push({
        answerId: answer.answerId,
        answer: answer.answer,
        correct: answer.correct,
        colour: answer.colour, // Include the colour of the answer
      });
    }

    // Add the formatted question to the list
    formattedQuestions.push({
      questionId: question.questionId,
      question: question.question,
      duration: question.duration,
      points: question.points,
      answers: formattedAnswers,
      thumbnailUrl: question.thumbnailUrl
    });
  }

  // Finally, assemble and return the formatted quiz object
  const formattedQuiz = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: formattedQuestions.length,
    questions: formattedQuestions,
    duration: totalDuration,
    thumbnailUrl: quiz.thumbnailUrl, // Corrected property name
  };

  return formattedQuiz;
}

/**
  * Function that updates the name of the relevant quiz.
  *
  * @param {string} token- The unique ID of a user
  * @param {integer} quizId - The unique ID of a quiz
  * @param {String} name - The new name for the quiz
  * ...
  *
  * @returns {} - If there are no errors
  * @returns {object}
  * Returns an error message string if :
  * - AuthUserId is not a valid user
  * - Quiz ID does not refer to a valid quiz
  * - Quiz ID does not refer to a quiz that this user owns
  * - Name contains invalid characters. Valid characters are alphanumeric and spaces.
  * - Name is either less than 3 characters long or more than 30 characters long.
  * - Name is already used by the current logged in user for another quiz.
  *
*/
export function adminQuizNameUpdate(token: string, quizId: number, name: string) {
  const data = getData();

  // Error check for AuthUserId is not a valid user
  const authUserId = checkSessionExists(token, data);
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  // Error check for  quiz does not exist
  if (!isQuizExist(data, quizId)) {
    throw HTTPError(403, 'QuizId is not valid');
  }

  // Error check if non-owner tried to access quiz info
  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'You do not have access to this Quiz');
  }

  // Error check for non-alphanumeric characters
  if (!isAlphanumeric(name)) {
    throw HTTPError(400, 'The name contains invalid characters');
  }

  // Check if name has correct length
  if (!isNameLenValid(name)) {
    throw HTTPError(400, 'The name length is invalid');
  }

  if (!isNameAlreadyExist(data, name)) {
    throw HTTPError(400, 'Quiz with the same name already exists');
  }

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizId);

  // Cf no errors proceed changing name and timeLastEdited
  data.quizzes[quizIndex].name = name;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  // Store the data back
  setData(data);

  return {

  };
}

/**
 * Function that updates the description of a quiz.
 *
 * @param {integer} token - The authentication token of the user updating the quiz description.
 * @param {integer} quizId - The unique ID of the quiz to be updated.
 * @param {string} description - The new description for the quiz.
 *
 * @returns {object} - Returns an empty object if successful.
 * @returns {object} - Returns an object with an error message if any error occurs:
 *                    { error: 'The following token does not exist' } - If the provided authentication token does not match any user session.
 *                    { error: 'QuizId does not refer to a valid quiz' } - If the provided quizId does not match any existing quiz.
 *                    { error: 'QuizId does not refer to a quiz that this user owns' } - If the user does not own the quiz with the provided quizId.
 *                    { error: 'Description length is too long' } - If the length of the description exceeds 100 characters.
 */
export function adminQuizDescriptionUpdate(token: string, quizId: number, description: string) {
  // fetch data
  const data = getData();
  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  // Return error if quiz with provided quizId does not exist
  if (!isQuizExist(data, quizId)) {
    throw HTTPError(403, 'QuizId does not refer to a valid quiz');
  }

  // Return error if the authUserId is not the owner
  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'QuizId does not refer to a quiz that this user owns');
  }

  // Valid description length
  if (!isDescriptionLenValid(description)) {
    throw HTTPError(400, 'Description length is too long');
  }

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizId);

  data.quizzes[quizIndex].description = description;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {

  };
}

/**
  * Updates the relevant details of a particular question within a quiz
  * When this route is called, the last edited time is updated, and the colours of all answers of that question are randomly generated.
  *
  * @param {integer} quizid - The unique ID of a quiz
  * @param {integer} questionid - The unique ID of a question in a quiz
  * @param {QuestionBody} questionBody - A body containing the user's token and the question's information, such as the question itself, duration, points, and answers
  *
  * @returns {} - If successful
  * @returns {object}
  * Returns an error message string if :
  * - Question string is less than 5 characters in length or greater than 50 characters in length
  * - The question has more than 6 answers or less than 2 answers
  * - The question duration is not a positive number
  * - If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes
  * - The points awarded for the question are less than 1 or greater than 10
  * - The length of any answer is shorter than 1 character long, or longer than 30 characters long
  * - Any answer strings are duplicates of one another (within the same question)
  * - There are no correct answers
  * - The thumbnailUrl is an empty string
  * - The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png
  * - The thumbnailUrl does not begin with 'http://' or 'https://'
*/

export function adminQuizQuestionUpdate(quizid: number, questionid: number, questionBody: QuestionBody, token: string): object | { error?: string } {
  // Get data from dataStore.js
  const data = getData();

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'Token is empty or invalid (does not refer to valid logged in user session)');
  }

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizid);
  const quiz = data.quizzes.find(q => q.quizId === quizid);

  if (isQuizOwner(data, quizid, authUserId) === false) {
    throw HTTPError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  let questionIndex = -1;
  let question;

  if (data.quizzes[quizIndex].questions === undefined) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  for (let i = 0; i < data.quizzes[quizIndex].questions.length; i++) {
    if (data.quizzes[quizIndex].questions[i].questionId === questionid) {
      questionIndex = i;
      question = data.quizzes[quizIndex].questions[i];
      break;
    }
  }

  if (question === undefined) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }
  if (questionBody.question.length < 5 || questionBody.question.length > 50) {
    throw HTTPError(400, 'Question string is less than 5 characters in length or greater than 50 characters in length');
  }

  const numAnswers = questionBody.answers.length;

  if (numAnswers < 2 || numAnswers > 6) {
    throw HTTPError(400, 'Question has more than 6 answers or less than 2 answers');
  }

  if (questionBody.duration <= 0) {
    throw HTTPError(400, 'The question duration is not a positive number');
  }

  let duration = 0;
  const maxDuration = 180; // 180 seconds = 3 mins

  for (const dataQuestion of quiz.questions) {
    if (dataQuestion.questionId === questionid) {
      // skip this one, as we are calculating for if it is updated...
      // if it will cross 3 minutes.
      continue;
    }
    duration += dataQuestion.duration;
  }

  // add the to be updated question's duration!
  duration += questionBody.duration;

  if (duration > maxDuration) {
    throw HTTPError(400, 'If the question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes');
  }

  if (questionBody.points < 1 || questionBody.points > 10) {
    throw HTTPError(400, 'The points awarded for the question are less than 1 or greater than 10');
  }

  for (const dataAnswer of questionBody.answers) {
    if (dataAnswer.answer.length < 1 || dataAnswer.answer.length > 30) {
      throw HTTPError(400, 'The length of any answer is shorter than 1 character long, or longer than 30 characters long');
    }
  }

  if (!questionBody.answers.some(answer => answer.correct)) {
    throw HTTPError(400, 'There are no correct answers');
  }

  for (let i = 0; i < numAnswers; i++) {
    const currAnswer = questionBody.answers[i];

    for (let j = i + 1; j < numAnswers; j++) {
      const otherAnswer = questionBody.answers[j];

      if (currAnswer.answer === otherAnswer.answer) {
        throw HTTPError(400, 'Any answers strings are duplicates of one another (within the same question)');
      }
    }
  }

  if (!questionBody.thumbnailUrl) {
    throw HTTPError(400, 'The thumbnailUrl is an empty string');
  }

  if (!isValidImageUrl(questionBody.thumbnailUrl)) {
    throw HTTPError(400, 'The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png or thumbnailUr does not start with http:// or https://');
  }

  // after all error checks, update question
  question.question = questionBody.question;
  question.duration = questionBody.duration;
  question.points = questionBody.points;
  question.thumbnailUrl = questionBody.thumbnailUrl;

  for (const answerIndex in questionBody.answers) {
    question.answers[answerIndex].answer = questionBody.answers[answerIndex].answer;
    question.answers[answerIndex].correct = questionBody.answers[answerIndex].correct;
    question.answers[answerIndex].colour = undefined;
    question.answers[answerIndex].answerId = data.quizzes[quizIndex].questions[questionIndex].answers[answerIndex].answerId;
  }

  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'brown', 'orange'];

  for (const dataAnswer of question.answers) {
    const randomNumber = Math.floor(Math.random() * colours.length);
    dataAnswer.colour = colours[randomNumber];
  }

  // actually update the database
  data.quizzes[quizIndex].questions[questionIndex] = question;
  setData(data);

  return {};
}

/**
  * Function that deletes a particular question from a quiz
  *
  * @param {integer} quizid - The unique ID of a quiz
  * @param {integer} questionid - The unique ID of a question
  * @param {any} token - Contains the unique sessionId of a user's login session
  * ...
  * @returns {} - If there are no errors
  * @returns {object}
  * Returns an error message string if :
  * - Token is empty or invalid (does not refer to valid logged in user session)
  * - Valid token is provided, but user is not an owner of this quiz
  * - Question Id does not refer to a valid question within this quiz
  * - Any session for this quiz is not in END state
*/

export function adminQuizQuestionDelete(quizid: number, questionid: number, token: string): object | { error?: string } {
  const data = getData();

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'Token is empty or invalid (does not refer to valid logged in user session)');
  }

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizid);
  const quiz = data.quizzes.find(q => q.quizId === quizid);

  if (!isQuizOwner(data, quizid, authUserId)) {
    throw HTTPError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  // Checks if the quiz has active sessions not in the END state
  if (quiz.activeQuizSessions !== undefined) {
    if (isActiveSession(quiz.activeQuizSessions)) {
      throw HTTPError(400, 'Any session for this quiz is not in END state');
    }
  }

  // if everything else is right (token, questionid, quizid), then find question & delete question,

  let questionExists = false;

  for (let questionIndex = 0; questionIndex < quiz.questions.length; questionIndex++) {
    const dataQuestion = data.quizzes[quizIndex].questions[questionIndex];

    if (dataQuestion.questionId === questionid) {
      questionExists = true;

      // delete question
      data.quizzes[quizIndex].questions.splice(questionIndex, 1);
      break;
    }
    questionIndex++;
  }

  if (questionExists === false) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  setData(data);

  return {};
}

/**
 * Function that retrieves quizzes currently in the trash for the authenticated user.
 *
 * @param {integer} token - The authentication token of the user viewing the quizzes in the trash.
 *
 * @returns {object} - Returns an object containing an array of quizzes in the trash if successful.
 * @returns {object} - Returns an object with an error message if any error occurs:
 *                    { error: 'The following token does not exist' } - If the provided authentication token does not match any user session.
 */
export function viewQuizInTrash(token: string): { quizzes: { quizId: number, name: string }[] } {
  // Fetch data
  const data = getData();

  // Error check for AuthUserId is not a valid user
  const authUserId = checkSessionExists(token, data);
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  // Array to store quizzes in the trash
  const quizInTrash = [];

  // Check if there are any quizzes in the trash
  if (data.users[authUserId].quizTrash === undefined) {
    return { quizzes: [] };
  }

  // Iterate through each quiz in the trash
  for (const quiz of data.users[authUserId].quizTrash) {
    quizInTrash.push({
      quizId: quiz.quizId,
      name: quiz.name,
    });
  }

  return { quizzes: quizInTrash };
}

/**
 * Transfers the ownership of a quiz to another user.
 *
 * @param {string} token - The token of the user
 * @param {integer} quizId - The ID of the quiz
 * @param {string} userEmail - The email of the user to which the quiz will be transferred
 *
 * @returns {object} - Returns an empty object
 * @returns {error} - Throws an error message
 */
export function adminQuizTransfer(token: string, quizId: number, userEmail: string): object | { error?: string } {
  // Gets the data
  const data: DataStore = getData();

  const authUserId = checkSessionExists(token, data);

  // Throws an error if the token does not exist in any session
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  // Calls isQuizExist and throws an error if quizId is invalid
  if (!isQuizExist(data, quizId)) {
    throw HTTPError(401, 'QuizId does not refer to a valid quiz');
  }

  // Calls isQuizOwner and throws an error when a valid token is provided, but the user is not the owner of this quiz
  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'QuizId does not refer to a quiz that this user owns');
  }

  // Finds the target user by email
  const targetUser = data.users.find(user => user.email === userEmail);
  if (targetUser === undefined) {
    throw HTTPError(400, 'userEmail is not a real user');
  }

  // Throws an error if the target user is the same as the currently logged in user
  if (targetUser.authUserId === authUserId) {
    throw HTTPError(400, 'userEmail is the current logged in user');
  }

  // Checks if the target user already owns a quiz with the same name
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (isNameAlreadyExist(data, quiz.name) && quiz.quizOwner === targetUser.authUserId) {
    throw HTTPError(400, 'Quiz ID refers to a quiz that has a name that is already used by the target user');
  }

  // Checks if the quiz has active sessions not in the END state
  if (quiz.activeQuizSessions && isActiveSession(quiz.activeQuizSessions)) {
    throw HTTPError(400, 'Any session for this quiz is not in END state');
  }

  // Checks if the quiz has inactive sessions not in the END state
  if (quiz.inactiveQuizSessions && isActiveSession(quiz.inactiveQuizSessions)) {
    throw HTTPError(400, 'Any session for this quiz is not in END state');
  }

  // Transfers the quiz
  quiz.quizOwner = targetUser.authUserId;

  // Sets the data
  setData(data);

  // Returns an empty object
  return {};
}

/**
 * Function that creates a new question for a specified quiz.
 *
 * @param {string} token - The token of the user
 * @param {integer} quizId - The ID of the quiz
 * @param {QuestionBody} questionBody - Object containing details of the question
 *
 * @returns {object} - Returns an object containing the questionId
 * @returns {object} - Returns an object with an error message
 */
export function adminQuizQuestionCreate(token: string, quizId: number, questionBody: QuestionBody): { questionId: number } | { error: string } {
  // Gets the data
  const data: DataStore = getData();

  const authUserId = checkSessionExists(token, data);

  // Throws an error if the token does not exist in any session
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId);

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizId);

  // Calls isQuizExist and throws an error if quizId is invalid
  if (!isQuizExist(data, quizId)) {
    throw HTTPError(401, 'QuizId does not refer to a valid quiz');
  }

  // Calls isQuizOwner and throws an error when a valid token is provided, but the user is not the owner of this quiz
  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'QuizId does not refer to a quiz that this user owns');
  }

  // Throws an error if question length is not appropriate
  if (!checkTextLength(questionBody.question, 5, 50)) {
    throw HTTPError(400, 'Question string is less than 5 characters in length or greater than 50 characters in length');
  }

  // Throws an error if answer length is not appropriate
  if (questionBody.answers.length < 2 || questionBody.answers.length > 6) {
    throw HTTPError(400, 'The question has more than 6 answers or less than 2 answers');
  }

  // Throws an error if question duration is not a positive number
  if (questionBody.duration < 0) {
    throw HTTPError(400, 'The question duration is not a positive number');
  }

  let totalDuration = 0;

  if (quiz.questions === undefined) {
    totalDuration = 0;
  } else {
    // Calculates the sum of the duration of the questions in a quiz
    for (let index = 0; index < quiz.questions.length; index++) {
      totalDuration += quiz.questions[index].duration;
    }
  }

  totalDuration += questionBody.duration;

  // Throws an error message if the total duration exceeds 3 minutes
  if (totalDuration > 180) {
    throw HTTPError(400, 'The sum of the question durations in the quiz exceeds 3 minutes');
  }

  // Throws an error if points awarded are less than 1 or greater than 10
  if (questionBody.points < 1 || questionBody.points > 10) {
    throw HTTPError(400, 'The points awarded for the question are less than 1 or greater than 10');
  }

  // Throws an error if the length of any answer is shorter than 1 character long, or longer than 30 characters long
  if (questionBody.answers.some(ans => ans.answer.length < 1 || ans.answer.length > 30)) {
    throw HTTPError(400, 'The length of an answer is less than 1 character long, or longer than 30 characters long');
  }

  // Checks for duplicate answer strings
  const answerString = questionBody.answers.map(ans => ans.answer);
  const checkDuplicates = answerString.some((item, index) => answerString.indexOf(item) !== index);
  if (checkDuplicates) {
    throw HTTPError(400, 'Answer strings are duplicates of one another (within the same question)');
  }

  let hasCorrectAnswer = false;
  for (let index = 0; index < questionBody.answers.length; index++) {
    if (questionBody.answers[index].correct) {
      hasCorrectAnswer = true;
      break;
    }
  }

  // Throws an error message if there are no correct answers
  if (!hasCorrectAnswer) {
    throw HTTPError(400, 'There are no correct answers');
  }

  // Throws an error if thumbnail is empty
  if (!questionBody.thumbnailUrl) {
    throw HTTPError(400, 'Thumbnail URL cannot be empty');
  }

  // Throws an error if thumbnail is does not end with .jpg, .jpeg, .png and start with http:// or https://
  if (!isValidImageUrl(questionBody.thumbnailUrl)) {
    throw HTTPError(400, 'Thumbnail URL must end with .jpg, .jpeg, .png and start with http:// or https://');
  }

  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'brown', 'orange'];
  const answers = [];

  for (let i = 0; i < questionBody.answers.length; i++) {
    const randomNumber = Math.floor(Math.random() * 7);
    const randomColour = colours[randomNumber];

    answers.push({
      answerId: generateAnswerId(),
      answer: questionBody.answers[i].answer,
      colour: randomColour,
      correct: questionBody.answers[i].correct
    });
  }

  let lengthOfQuestionsArray = 0;
  if (data.quizzes[quizIndex].questions !== undefined) {
    lengthOfQuestionsArray = data.quizzes[quizIndex].questions.length;
  }

  // Adds the new question to the quiz
  const newQuestion: QuestionCreate = {
    questionId: lengthOfQuestionsArray,
    question: questionBody.question,
    duration: questionBody.duration,
    points: questionBody.points,
    answers: answers,

    thumbnailUrl: questionBody.thumbnailUrl
  };

  // Push the code
  for (let index = 0; index < questionBody.answers.length; index++) {
    newQuestion.answers.push();
  }

  if (!quiz.questions) {
    quiz.questions = [];
  }

  quiz.questions.push(newQuestion);

  // Sets the data
  setData(data);

  // Returns the questionId
  return { questionId: newQuestion.questionId };
}

/**
 * Function that empties the trash by permanently deleting quizzes.
 *
 * @param {integer} token - The authentication token of the user performing the action.
 * @param {Array} quizIds - An array containing the unique IDs of the quizzes to be permanently deleted.
 *
 * @returns {object} - Returns an empty object if successful.
 * @returns {object} - Returns an object with an error message if any error occurs:
 *                    { error: 'The trash is already empty' } - If the trash is already empty.
 *                    { error: 'The following token does not exist' } - If the provided authentication token does not match any user session.
 *                    { error: 'One or more of the Quiz IDs is not currently in the trash' } - If one or more of the provided quizIds are not in the trash.
 *                    { error: 'Some quizzes are not owned by you.' } - If one or more quizzes in the trash are not owned by the authenticated user.
 */

export function emptyTrash(token: string, quizIds: number[]) {
  // Fetch data
  const data = getData();

  // Check if the provided token matches any user session
  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  // Check if trash is already empty
  if (data.users[authUserId].quizTrash === undefined) {
    throw HTTPError(400, 'One or more of the Quiz IDs is not currently in the trash');
  }

  let owner = true;
  for (const user of data.users) {
    for (const userTrash of user.quizTrash) {
      for (const trashQuizId of quizIds) {
        if (userTrash.quizOwner !== authUserId) {
          // we check if the a different user is the owner of the quiz in QuizIds array
          if (userTrash.quizId === trashQuizId) {
            owner = false;
          }
        }
      }
    }
  }

  const quizzesOwned = adminQuizList(token);

  for (const trashQuizId of quizIds) {
    for (const quiz of data.quizzes) {
      if (quiz.quizId === trashQuizId) {
        // we check if the a different user is the owner of the quiz in QuizIds array
        if (quiz.quizOwner !== authUserId) {
          owner = false;
        }
      }
    }
  }

  if (owner === false) {
    throw HTTPError(403, 'Some quizzes are not owned by you.');
  }

  // Check if the quizId exists in the trash array
  for (const trashQuizId of quizIds) {
    for (const quizOwned of quizzesOwned.quizzes) {
      if (quizOwned.quizId === trashQuizId) {
        throw HTTPError(400, 'One or more of the Quiz IDs is not currently in the trash');
      }
    }
  }

  // Remove specified quizzes from the trash
  const updatedTrash = [];
  for (const trashQuiz of data.users[authUserId].quizTrash) {
    let shouldKeep = true;
    for (const quizId of quizIds) {
      if (trashQuiz.quizId === quizId) {
        shouldKeep = false;
        break;
      }
    }

    if (shouldKeep) {
      updatedTrash.push(trashQuiz);
    }
  }

  // Assign the updated trash array back to data.quizzes.trash
  data.users[authUserId].quizTrash = updatedTrash;
  setData(data);

  return {};
}

/**
 * Restores a quiz from trash back to active quizzes.
 *
 * @param {number} quizId - The unique ID of the quiz to restore.
 * @param {string} token - The token of the user attempting to restore the quiz.
 *
 * @returns {Object} - Returns an empty object on success or an object with an error message.
 */

export function restoreQuizFromTrash(quizId: number, token: string) {
  const data = getData();

  // Find the user by token
  let user: User = null;
  for (const currentUser of data.users) {
    if (currentUser.sessions.includes(token)) {
      user = currentUser;
      break;
    }
  }

  // Check if token is invalid or user is not found
  if (!user) {
    throw HTTPError(401, 'Token is empty or invalid');
  }

  // Check if the trash is empty
  if (!user.quizTrash || user.quizTrash.length === 0) {
    throw HTTPError(401, 'Trash is currently empty');
  }

  // Find the quiz in the trash
  let quizIndex = -1;
  for (let i = 0; i < user.quizTrash.length; i++) {
    if (user.quizTrash[i].quizId === quizId) {
      quizIndex = i;
      break;
    }
  }

  // Check if the quiz is not in the trash
  if (quizIndex === -1) {
    throw HTTPError(400, 'Quiz ID refers to a quiz that is not currently in the trash');
  }

  // Check ownership of the quiz
  const quizInTrash = user.quizTrash[quizIndex];
  if (quizInTrash.quizOwner !== user.authUserId) {
    throw HTTPError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  // Check for duplicate quiz names in active quizzes
  const duplicateName = data.quizzes.some(quiz => quiz.name === quizInTrash.name && quiz.quizOwner === user.authUserId);
  if (duplicateName) {
    throw HTTPError(400, 'Quiz name of the restored quiz is already used by another active quiz');
  }

  // Restore the quiz
  data.quizzes.push(quizInTrash);
  user.quizTrash.splice(quizIndex, 1);

  setData(data);

  return {};
}

/**
 * Moves a question within a quiz to a new position.
 *
 * @param {string} token - User authentication token.
 * @param {number} quizId - ID of the quiz containing the question.
 * @param {number} questionId - ID of the question to be moved.
 * @param {number} newPosition - New position index for the question.
 * @returns {Object} - An empty object indicating successful operation.
 * @throws {HTTPError} - If authentication fails, question or quiz not found,
 *     invalid new position, or user does not have permission.
 */
export function adminQuizMoveQuestion(token: string, quizId: number, questionId: number, newPosition: number) {
  const data = getData();

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizId);

  let from = 0;
  if (data.quizzes[quizIndex].questions) {
    for (let i = 0; i < data.quizzes[quizIndex].questions.length; i++) {
      if (data.quizzes[quizIndex].questions[i].questionId === questionId) {
        from = i;
        break;
      }
    }
  }

  if (!findQuestionId(data, quizIndex, questionId)) {
    throw HTTPError(400, 'Question not found');
  }

  if (newPosition < 0 || newPosition >= data.quizzes[quizIndex].questions.length) {
    throw HTTPError(400, 'Invalid new position');
  }

  if (newPosition === from) {
    throw HTTPError(400, 'The new position entered is the current position of the question');
  }

  const authUserId = checkSessionExists(token, data);
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  if (!isQuizExist(data, quizId)) {
    throw HTTPError(403, 'QuizId does not refer to a valid quiz');
  }

  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'QuizId does not refer to a quiz that this user owns');
  }

  const tempQuestion = data.quizzes[quizIndex].questions[from];
  data.quizzes[quizIndex].questions.splice(from, 1);

  data.quizzes[quizIndex].questions.splice(newPosition, 0, tempQuestion);

  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

/**
 * Duplicates a question within a quiz.
 *
 * @param {string} token - User authentication token.
 * @param {number} quizId - ID of the quiz containing the question.
 * @param {number} questionId - ID of the question to be duplicated.
 * @returns {{ newQuestionId: number }} - Object containing the ID of the newly duplicated question.
 * @throws {HTTPError} - If authentication fails, question or quiz not found,
 *     or user does not have permission.
 */
export function adminQuizDuplicateQuestion(token: string, quizId: number, questionId: number): {newQuestionId: number} {
  const data = getData();

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizId);

  if (!data.quizzes[quizIndex].questions) {
    throw HTTPError(400, 'Question not found');
  }

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  if (!isQuizExist(data, quizId)) {
    throw HTTPError(403, 'QuizId does not refer to a valid quiz');
  }

  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'QuizId does not refer to a quiz that this user owns');
  }

  let questionToDup;
  let k = 0;
  if (data.quizzes[quizIndex].questions) {
    for (let i = 0; i < data.quizzes[quizIndex].questions.length; i++) {
      if (data.quizzes[quizIndex].questions[i].questionId === questionId) {
        k = i;
        questionToDup = data.quizzes[quizIndex].questions[i];
        break;
      }
    }
  }
  const answerBody = [];
  for (let i = 0; i < questionToDup.answers.length; i++) {
    const answer = questionToDup.answers[i].answer;
    const correct = questionToDup.answers[i].correct;
    const oneAns = { answer, correct };
    answerBody.push(oneAns);
  }

  const questionToDupBody = {
    question: questionToDup.question,
    answers: answerBody,
    duration: questionToDup.duration,
    points: questionToDup.points,
    thumbnailUrl: questionToDup.thumbnailUrl,
  };

  const newQuestion: { questionId: number } | { error: string } = adminQuizQuestionCreate(token, quizId, questionToDupBody);

  if ('questionId' in newQuestion) {
    adminQuizMoveQuestion(token, quizId, newQuestion.questionId, k + 1);
  }
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);

  if ('questionId' in newQuestion) {
    return {
      newQuestionId: newQuestion.questionId
    };
  }
}

/**
  * Function retrieves active and inactive session ids (sorted in ascending order) for a quiz
  *
  * @param {integer} quizid - The unique ID of a quiz
  * @param {any} token - Contains the unique sessionId of a user's login session
  * ...
  *
  * @returns {ViewSessionsReturnObject} - If there are no errors
  * @returns {object}
  * Returns an error message string if :
  * - Token is empty or invalid (does not refer to valid logged in user session)
  * - Valid token is provided, but user is not an owner of this quiz
*/

export function adminQuizViewSessions(token: string, quizid: number): ViewSessionsReturnObject | {error?: string} {
  // Get data from dataStore.ts
  const data = getData();

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'Token is empty or invalid (does not refer to valid logged in user session)');
  }

  let quizIdCounter = 0;
  let quizIndex = -1;

  for (const dataQuiz of data.quizzes) {
    if (dataQuiz.quizId === quizid) {
      if (dataQuiz.quizOwner === authUserId) {
        quizIndex = quizIdCounter;
      }
      break;
    }
    quizIdCounter++;
  }

  if (!isQuizOwner(data, quizid, authUserId)) {
    throw HTTPError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  let sortedActiveSessionIds = data.quizzes[quizIndex].activeSessionIds;
  let sortedInactiveSessionIds = data.quizzes[quizIndex].inactiveSessionIds;

  if (sortedActiveSessionIds === undefined || sortedActiveSessionIds.length === 0) {
    sortedActiveSessionIds = [];
  } else {
    sortedActiveSessionIds.sort((a, b) => a - b);
  }
  if (sortedInactiveSessionIds === undefined || sortedInactiveSessionIds.length === 0) {
    sortedInactiveSessionIds = [];
  } else {
    sortedInactiveSessionIds.sort((a, b) => a - b);
  }

  const activeSessions = sortedActiveSessionIds;
  const inactiveSessions = sortedInactiveSessionIds;

  return {
    activeSessions,
    inactiveSessions
  };
}

function generateSessionID() {
  return Math.floor(Math.random() * 1000);
}

/**
  * Function that given a quiz, makes a new session and copies the quiz, so that any edits whilst a session is running does not affect active session
  *
  * @param {integer} quizid - The unique ID of a quiz
  * @param {any} token - Contains the unique sessionId of a user's login session
  * @param {integer} autoStartNum - The number of people to autostart the quiz once that number of people join. If this number is 0, then no auto start will occur.
  * ...
  *
  * @returns {object} - Returns an object with the sessionId if there are no errors
  * @returns {object}
  * Returns an error message string if :
  * - Returns an error message if:
  * - Token is empty or invalid (does not refer to valid logged in user session)
  * - Valid token is provided, but user is not an owner of this quiz
  * - autoStartNum is a number greater than 50
  * - A maximum of 10 sessions that are not in END state currently exist for this quiz
  * - The quiz does not have any questions in it
  * - The quiz is in trash
*/

export function adminQuizNewSession(quizid: number, token: string, autoStartNum: number): { sessionId: number } | { error: string } {
  const data = getData();

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'Token is empty or invalid (does not refer to valid logged in user session)');
  }

  let quizIdCounter = 0;
  let quizIndex = -1;

  for (const dataQuiz of data.quizzes) {
    if (dataQuiz.quizId === quizid) {
      if (dataQuiz.quizOwner === authUserId) {
        quizIndex = quizIdCounter;
      }
      break;
    }
    quizIdCounter++;
  }

  const quizzesInTrash = viewQuizInTrash(token);

  if (quizzesInTrash.quizzes.some(quiz => quiz.quizId === quizid)) {
    throw HTTPError(400, 'The quiz is in trash');
  }

  if (!isQuizOwner(data, quizid, authUserId)) {
    throw HTTPError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  if (autoStartNum > 50) {
    throw HTTPError(400, 'autoStartNum is a number greater than 50');
  }

  // look for only active sessions, that are not in the END state
  if (data.quizzes[quizIndex].activeQuizSessions === undefined) {
    // skip the length check below if no quiz sessions have been created before
  } else if (data.quizzes[quizIndex].activeQuizSessions.length >= 10) {
    throw HTTPError(400, 'A maximum of 10 sessions that are not in END state currently exist for this quiz');
  }

  // in case questions array hasnt been made yet, as no questions have
  // ever been added... so the question array doesnt exist
  if (data.quizzes[quizIndex].questions === undefined) {
    throw HTTPError(400, 'The quiz does not have any questions in it');
  }

  // if questions have been added and deleted so there are none now
  if (data.quizzes[quizIndex].questions.length === 0) {
    throw HTTPError(400, 'The quiz does not have any questions in it');
  }

  // copy the quiz (in its current version), and paste it in a quiz session!
  const copiedQuiz = JSON.parse(JSON.stringify(data.quizzes[quizIndex]));

  for (let i = 0; i < data.quizzes[quizIndex].questions.length; i++) {
    copiedQuiz.questions[i].corrAnsIds = [];
    copiedQuiz.questions[i].currCorrAnsRank = 0;
    copiedQuiz.questions[i].playerResults = [];
  }

  const sessionId = generateSessionID();

  copiedQuiz.sessionId = sessionId;

  copiedQuiz.autoStartNum = autoStartNum;

  // default state and atQuestion of a quiz session
  copiedQuiz.state = 'LOBBY';
  copiedQuiz.atQuestion = 0;

  copiedQuiz.guests = [];

  if (data.quizzes[quizIndex].activeSessionIds === undefined) {
    data.quizzes[quizIndex].activeSessionIds = [];
  }
  if (data.quizzes[quizIndex].activeQuizSessions === undefined) {
    data.quizzes[quizIndex].activeQuizSessions = [];
  }

  // stores the sessionIds
  data.quizzes[quizIndex].activeSessionIds.push(sessionId);
  // stores the actual state of a quiz in a session
  data.quizzes[quizIndex].activeQuizSessions.push(copiedQuiz);

  setData(data);

  return {
    sessionId: sessionId
  };
}

/**
  * Update the state of a particular quiz session by sending an action command
  *
  * @param {integer} quizid - The unique ID of a quiz
  * @param {integer} sessionid - The unique ID of a session of a quiz
  * @param {string} token - The authentication token of the admin user
  * @param {string} action - The command that determines which state the quiz session gets updated to
  *
  * @returns {} - If successful
  * @returns {object}
  * Returns an error message string if :
  * - Session Id does not refer to a valid session within this quiz
  * - Action provided is not a valid Action enum
  * - Action enum cannot be applied in the current state
  * - Token is empty or invalid (does not refer to valid logged in user session)
  * - Valid token is provided, but user is not an owner of this quiz
*/

export function adminQuizUpdateSessionState(quizid: number, sessionid: number, token: string, action: string) {
  // Get data from dataStore.ts
  const data = getData();

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'Token is empty or invalid (does not refer to valid logged in user session)');
  }

  let quizIdCounter = 0;
  let quizIndex = -1;

  for (const dataQuiz of data.quizzes) {
    if (dataQuiz.quizId === quizid) {
      if (dataQuiz.quizOwner === authUserId) {
        quizIndex = quizIdCounter;
      }
      break;
    }
    quizIdCounter++;
  }

  if (!isQuizOwner(data, quizid, authUserId)) {
    throw HTTPError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  // if the array activeSesssionIds doesnt exist, it means no sesisons have ever been created
  if (data.quizzes[quizIndex].activeSessionIds === undefined) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }

  if (!data.quizzes[quizIndex].activeSessionIds.includes(sessionid)) {
    if (data.quizzes[quizIndex].inactiveSessionIds === undefined) {
      throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
    }

    if (data.quizzes[quizIndex].inactiveSessionIds.includes(sessionid)) {
      // the quiz is in END state and any actions can't be applied to it
      throw HTTPError(400, 'Action enum cannot be applied in the current state');
    } else {
      // if quiz session id cannot be found in both active and inactive sessionIds, then it doesn't exist
      throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
    }
  }

  if (action !== 'NEXT_QUESTION' && action !== 'SKIP_COUNTDOWN' && action !== 'GO_TO_ANSWER' && action !== 'GO_TO_FINAL_RESULTS' && action !== 'END') {
    throw HTTPError(400, 'Action provided is not a valid Action enum');
  }

  let session;
  let sessionCounter = 0;
  let sessionIndex: number;

  for (const dataSession of data.quizzes[quizIndex].activeQuizSessions) {
    if (dataSession.sessionId === sessionid) {
      session = dataSession;
      sessionIndex = sessionCounter;
    }
    sessionCounter++;
  }

  // all states (except for END state) can go to END state, so no need to check if action is valid or not
  if (action === 'END') {
    // CANCEL any setTimeouts if they were set before if state was in QUESTION_COUNTDOWN or QUESTION_OPEN

    if (session.state === 'QUESTION_COUNTDOWN') {
      clearTimeout(quizTimeoutMap[sessionid].toQUESTION_OPENTimeoutId);
      clearTimeout(quizTimeoutMap[sessionid].toQUESTION_CLOSETimeoutId);
    } else if (session.state === 'QUESTION_OPEN') {
      clearTimeout(quizTimeoutMap[sessionid].toQUESTION_CLOSETimeoutId);
    }

    if (data.quizzes[quizIndex].inactiveQuizSessions === undefined) {
      data.quizzes[quizIndex].inactiveQuizSessions = [];
    }
    if (data.quizzes[quizIndex].inactiveSessionIds === undefined) {
      data.quizzes[quizIndex].inactiveSessionIds = [];
    }

    // reset the atQuestion to 0 when its in END state
    data.quizzes[quizIndex].activeQuizSessions[sessionIndex].atQuestion = 0;
    data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'END';

    data.quizzes[quizIndex].inactiveQuizSessions.push(data.quizzes[quizIndex].activeQuizSessions[sessionIndex]);
    data.quizzes[quizIndex].inactiveSessionIds.push(data.quizzes[quizIndex].activeQuizSessions[sessionIndex].sessionId);

    const sessionIdIndex = data.quizzes[quizIndex].activeSessionIds.indexOf(data.quizzes[quizIndex].activeQuizSessions[sessionIndex].sessionId);

    // remove them from the activeSessions array
    data.quizzes[quizIndex].activeQuizSessions.splice(sessionIndex, 1);
    data.quizzes[quizIndex].activeSessionIds.splice(sessionIdIndex, 1);

    setData(data);
    return {};
  }

  let wasLobby = false;

  if (session.state === 'LOBBY') {
    wasLobby = true;

    if (action === 'NEXT_QUESTION') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'QUESTION_COUNTDOWN';
    } else {
      throw HTTPError(400, 'Action enum cannot be applied in the current state');
    }
  } else if (session.state === 'QUESTION_COUNTDOWN') {
    if (action === 'SKIP_COUNTDOWN') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'QUESTION_OPEN';

      const atQuestion = data.quizzes[quizIndex].activeQuizSessions[sessionIndex].atQuestion;

      // atQuestion - 1 because atQuestion refers to 1st question as 1, and questions array refers to 1st question as [0]
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].questions[atQuestion - 1].timeQuestionOpen = Math.floor(Date.now() / 1000);

      clearTimeout(quizTimeoutMap[sessionid].toQUESTION_OPENTimeoutId);
    } else {
      throw HTTPError(400, 'Action enum cannot be applied in the current state');
    }
  } else if (session.state === 'QUESTION_OPEN') {
    if (action === 'GO_TO_ANSWER') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'ANSWER_SHOW';

      clearTimeout(quizTimeoutMap[sessionid].toQUESTION_CLOSETimeoutId);
    } else {
      throw HTTPError(400, 'Action enum cannot be applied in the current state');
    }
  } else if (session.state === 'QUESTION_CLOSE') {
    if (action === 'GO_TO_ANSWER') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'ANSWER_SHOW';
    } else if (action === 'GO_TO_FINAL_RESULTS') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'FINAL_RESULTS';
    } else if (action === 'NEXT_QUESTION') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'QUESTION_COUNTDOWN';
    } else {
      throw HTTPError(400, 'Action enum cannot be applied in the current state');
    }
  } else if (session.state === 'ANSWER_SHOW') {
    if (action === 'GO_TO_FINAL_RESULTS') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'FINAL_RESULTS';
    } else if (action === 'NEXT_QUESTION') {
      data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'QUESTION_COUNTDOWN';
    } else {
      throw HTTPError(400, 'Action enum cannot be applied in the current state');
    }
  } else if (session.state === 'FINAL_RESULTS') {
    // other than END action (which is already accounted for above), there is no other valid action for FINAL_RESULTS state
    throw HTTPError(400, 'Action enum cannot be applied in the current state');
  }
  // END state already accounted for above

  const countdown = 3; // 3 seconds
  const atQuestion = data.quizzes[quizIndex].activeQuizSessions[sessionIndex].atQuestion;

  let duration;

  if (wasLobby === true) {
    // atQuestion is at 0, but we are starting the first question
    duration = data.quizzes[quizIndex].questions[atQuestion].duration;
  } else {
    // atQuestion is at 1 now, but question is still at questions[0], so do -1
    duration = data.quizzes[quizIndex].questions[atQuestion - 1].duration;
  }

  if (action === 'NEXT_QUESTION') {
    // increment atQuestion
    if (data.quizzes[quizIndex].activeQuizSessions[sessionIndex].atQuestion === data.quizzes[quizIndex].questions.length) {
      throw HTTPError(400, 'This was the last question in the quiz, please END the quiz');
    }
    data.quizzes[quizIndex].activeQuizSessions[sessionIndex].atQuestion++;

    const durationCopy = duration;

    quizTimeoutMap[sessionid] = {
      toQUESTION_OPENTimeoutId: setTimeout(() => {
        // set state to QUESTION_OPEN after countdown is done
        data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'QUESTION_OPEN';

        const atQuestion = data.quizzes[quizIndex].activeQuizSessions[sessionIndex].atQuestion;

        // atQuestion - 1 because atQuestion refers to 1st question as 1, and questions array refers to 1st question as [0]
        data.quizzes[quizIndex].activeQuizSessions[sessionIndex].questions[atQuestion - 1].timeQuestionOpen = Math.floor(Date.now() / 1000);

        // start the timeout for going to QUESTION_CLOSE state if it finished the previous timeout and is at QUESTION_OPEN state now
        quizTimeoutMap[sessionid] = {
          toQUESTION_CLOSETimeoutId: setTimeout(() => {
            // set state to QUESTION_CLOSE after duration of question is over
            data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'QUESTION_CLOSE';
          }, durationCopy * 1000)
        };
      }, countdown * 1000)
    };
  } else if (action === 'SKIP_COUNTDOWN') {
    quizTimeoutMap[sessionid] = {
      toQUESTION_CLOSETimeoutId: setTimeout(() => {
        // set state to QUESTION_CLOSE after duration is done
        data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state = 'QUESTION_CLOSE';
      }, duration * 1000)
    };
  }

  // reset atQuestion to 0 if state is at FINAL_RESULTS or END
  if (data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state === 'FINAL_RESULTS') {
    data.quizzes[quizIndex].activeQuizSessions[sessionIndex].atQuestion = 0;
  }

  setData(data);
  return {};
}

/**
 * Retrieves the status information of a quiz session for an admin user.
 *
 * @param {string} token - The authentication token of the admin user.
 * @param {number} quizId - The unique ID of the quiz.
 * @param {number} sessionId - The unique ID of the quiz session.
 * @returns {QuizStatusInfoObject} An object containing the status information of the quiz session.
 * @throws {Error} Throws an error if :
 *  - 'Invalid quizId.'
 *  - 'Session Id does not refer to a valid session within this quiz'
 *  - 'Invalid token.'
 *  -  Valid token is provided, but user is not an owner of this quiz.
 */
export function adminQuizGetQuizStatus(token: string, quizId: number, sessionId: number) : QuizStatusInfoObject | { error?: string } {
  const data: DataStore = getData();
  // find quizIndex
  const quizIndex = data.quizzes.findIndex(quiz => quiz.quizId === quizId);

  if (quizIndex === -1) {
    throw HTTPError(400, 'Invalid quizId.');
  }

  // Quiz session is active
  let findQuizSession;
  if (data.quizzes[quizIndex].activeQuizSessions) {
    findQuizSession = data.quizzes[quizIndex].activeQuizSessions.find(session => session.sessionId === sessionId);
  }

  // Quiz session might be inactive
  if (!findQuizSession && data.quizzes[quizIndex].inactiveQuizSessions) {
    findQuizSession = data.quizzes[quizIndex].inactiveQuizSessions.find(session => session.sessionId === sessionId);
  }

  // if none, then no valid quiz session
  if (!findQuizSession) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }

  // Error check valid session exists
  const authUserId: number = checkSessionExists(token, data);
  if (authUserId === -1) {
    throw HTTPError(401, 'Token is empty or invalid (does not refer to valid logged in user session)');
  }

  // error check user is owner of quiz
  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  // make player array and sort it
  const playerArr = [];
  let y = 0;
  for (let i = 0; i < findQuizSession.guests.length; i++) {
    playerArr[y] = findQuizSession.guests[i].playerName;
    y++;
  }
  playerArr.sort();

  const questionArr = []; // Initialize questionArr as an empty array
  let quizDuration = 0;

  for (let j = 0; j < findQuizSession.questions.length; j++) {
    const question = findQuizSession.questions[j]; // Use j as the index for questions array
    const questionObject = {
      questionId: question.questionId,
      question: question.question,
      duration: question.duration,
      thumbnailUrl: question.thumbnailUrl,
      points: question.points,
      answers: question.answers
    };
    questionArr.push(questionObject); // Push the created question object to questionArr
    quizDuration += question.duration;
  }

  const metadata: QuizInfoObject = {
    quizId: data.quizzes[quizIndex].quizId,
    name: findQuizSession.name,
    timeCreated: findQuizSession.timeCreated,
    timeLastEdited: findQuizSession.timeLastEdited,
    description: findQuizSession.description,
    numQuestions: findQuizSession.questions.length,
    questions: questionArr,
    duration: quizDuration,
    thumbnailUrl: data.quizzes[quizIndex].thumbnailUrl,
  };

  // const metadata: QuizInfoObject | { error?: string } = adminQuizInfo(token, quizId);

  // // build return object

  const returnObject = {
    state: findQuizSession.state,
    atQuestion: findQuizSession.atQuestion,
    players: playerArr,
    metadata: metadata,
  };

  return returnObject;
}

/**
 * Allows an admin to join a quiz session as a guest player.
 * When this function is called, the admin is added as a guest player to the specified quiz session.
 *
 * @param {number} sessionId - The unique identifier of the quiz session to join.
 * @param {string} name - The name of the admin joining as a guest player. If left empty, a random name will be generated.
 *
 * @returns {Object} An object containing the unique identifier of the newly joined guest player.
 *
 * @throws {HTTPError} Throws an error if:
 *   - The session ID does not refer to a valid session.
 *   - The current state of the session is not LOBBY.
 *   - The given name already exists.
 */

export function adminQuizGuestJoin(sessionId: number, name: string): {playerId: number} {
  const data = getData();
  let quizIndex = 0;
  let sessionIndex = 0;

  // Finding the session index and quiz index
  for (quizIndex = 0; quizIndex < data.quizzes.length; quizIndex++) {
    const quiz = data.quizzes[quizIndex];
    sessionIndex = quiz.activeQuizSessions.findIndex(session => session.sessionId === sessionId);
    if (sessionIndex !== -1) {
      break;
    }
  }

  // If session does not exist, throw an error
  if (sessionIndex === -1) {
    throw HTTPError(400, 'Session Id does not refer to a valid session');
  }

  // check if state is LOBBY
  const state = data.quizzes[quizIndex].activeQuizSessions[sessionIndex].state;
  if (state !== 'LOBBY') {
    throw HTTPError(400, 'The current state is not LOBBY');
  }

  // Checking if a random name needs to be generated
  if (name === '') {
    name = randomNameGenerator();
  }

  // check if the name already exists or not
  for (const quiz of data.quizzes) {
    for (const session of quiz.activeQuizSessions) {
      if (session.guests !== undefined) {
        for (const player of session.guests) {
          // If the name is already taken, throw an error
          if (player.playerName === name) {
            throw HTTPError(400, 'The given name already exists');
          }
        }
      }
    }
  }

  const playerId = generatePlayerId();
  // Adding a new guest onto the guests array
  data.quizzes[quizIndex].activeQuizSessions[sessionIndex].guests.push({ playerId: playerId, playerName: name });

  setData(data);

  return { playerId: playerId };
}

/**
 * Updates the thumbnail of a quiz by the admin.
 * When this function is called, the thumbnail URL of the specified quiz is updated with the provided image URL.
 *
 * @param {number} quizId - The unique identifier of the quiz to update.
 * @param {string} token - The authentication token of the admin user.
 * @param {string} imgUrl - The URL of the new thumbnail image.
 *
 * @returns {Object} An empty object indicating successful update of the quiz thumbnail.
 *
 * @throws {HTTPError} Throws an error if:
 *   - The authentication token does not exist.
 *   - The user does not have ownership access to the specified quiz.
 *   - The provided image URL is not valid.
 */

export function adminQuizUpdateThumbnail(quizId: number, token: string, imgUrl: string) {
  const data: DataStore = getData();

  // error checking
  const authUserId: number = checkSessionExists(token, data);
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists.');
  }

  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'You do not have access to this Quiz');
  }

  if (!isValidImageUrl(imgUrl)) {
    throw HTTPError(400, 'The given image url is not valid');
  }

  // Find the quizIndex
  const quizIndex: number = data.quizzes.findIndex(quiz => quiz.quizId === quizId);

  // update the thumbnail and timeLastEdited
  data.quizzes[quizIndex].thumbnailUrl = imgUrl;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

/**
 * Retrieves the status information of a player in a quiz session, either active or inactive.
 * @param playerId The unique identifier of the player.
 * @returns An object containing the status information of the player in the quiz session.
 * @throws Throws an HTTP 400 error if the provided playerId does not exist.
 */
export function adminQuizGuestStatus(playerId: number): PlayerStatusInfoObject {
  const data: DataStore = getData();

  let quizId: number;
  let sessionId = 0;
  let sessionId2 = null;
  let isInactiveSession = null;

  // Checks if player is in inactive session
  let playerIdFound = false;
  for (const quiz of data.quizzes) {
    for (const session of quiz.activeQuizSessions) {
      if (session.guests !== undefined) {
        for (const player of session.guests) {
          if (player.playerId === playerId) {
            quizId = quiz.quizId;
            sessionId2 = sessionId;
            playerIdFound = true;
            isInactiveSession = false;
            break;
          }
        }
      }
      sessionId++;
    }
  }

  // if it's not in active session, check in innactive
  if (isInactiveSession === null) {
    for (const quiz of data.quizzes) {
      if (quiz.inactiveQuizSessions !== undefined) {
        for (const session of quiz.inactiveQuizSessions) {
          if (session.guests !== undefined) {
            for (const player of session.guests) {
              if (player.playerId === playerId) {
                quizId = quiz.quizId;
                sessionId2 = sessionId;
                playerIdFound = true;
                isInactiveSession = true;
                break;
              }
            }
          }
          sessionId++;
        }
      }
    }
  }

  if (!playerIdFound) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  const quizIndex = data.quizzes.findIndex(q => q.quizId === quizId);
  let state = null;
  let numQuestion = null;
  if (isInactiveSession) {
    state = data.quizzes[quizIndex].inactiveQuizSessions[sessionId2].state;
    numQuestion = data.quizzes[quizIndex].inactiveQuizSessions[sessionId2].questions.length;
  } else {
    state = data.quizzes[quizIndex].activeQuizSessions[sessionId2].state;
    numQuestion = data.quizzes[quizIndex].activeQuizSessions[sessionId2].questions.length;
  }

  let atQuestion: number = null;
  if (state === 'LOBBY' || state === 'FINAL_RESULTS' || state === 'END') {
    atQuestion = 0;
  } else {
    atQuestion = data.quizzes[quizIndex].activeQuizSessions[sessionId2].atQuestion;
  }

  return {
    state: state,
    numQuestion: numQuestion,
    atQuestion: atQuestion,
  };
}

/**
 * Submits player answers for a specific question in an active quiz session.
 *
 * @param {number} playerId - The ID of the player submitting the answers.
 * @param {number} questionPosition - The position of the question in the session (starting from 1).
 * @param {number[]} answerIds - An array of answer IDs chosen by the player.
 *
 * @throws {HTTPError} - Throws an HTTP error with a status code and message if any validation fails.
 *
 * @returns {Object} - An empty object indicating successful submission of player answers.
 */
export function adminQuizSubmitPlayerAnswers(playerId: number, questionPosition: number, answerIds: number[]) {
  const timeNow = Math.floor(Date.now() / 1000);

  const data: DataStore = getData();
  let playerIdFound = false;
  let quizSeshFound;
  let quizFound;
  let playerFound;
  for (const quiz of data.quizzes) {
    quizFound = quiz;
    for (const session of quiz.activeQuizSessions) {
      quizSeshFound = session;
      if (session.guests) {
        for (const player of session.guests) {
          if (player.playerId === playerId) {
            playerFound = player;
            playerIdFound = true;
            break;
          }
        }
      }
    }
  }
  if (!playerIdFound) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  if (quizFound.questions.length < questionPosition || questionPosition < 0) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  if (quizSeshFound.state !== 'QUESTION_OPEN') {
    throw HTTPError(400, 'Session is not in QUESTION_OPEN state');
  }

  if (quizSeshFound.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }

  for (const id of answerIds) {
    const answer = quizFound.questions[questionPosition - 1].answers.find(answer => answer.answerId === id);
    // quizFound.questions[questionPosition - 1].answers.includes(id)
    if (!answer) {
      throw HTTPError(400, 'Answer IDs are not valid for this particular question');
    }
  }

  if (hasDuplicates(answerIds)) {
    throw HTTPError(400, 'There are duplicate answer IDs provided');
  }

  if (!answerIds.length) {
    throw HTTPError(400, 'Less than 1 answer ID was submitted');
  }
  // the question we are looking at
  const question = quizSeshFound.questions[questionPosition - 1];

  // add the correct answer's answerId to corrAnsId field
  let s = 0;
  for (let k = 0; k < question.answers.length; k++) {
    if (question.answers[k].correct) {
      question.corrAnsIds[s] = question.answers[k].answerId;
      s++;
    }
  }

  // If player inputs right answer, add 1 to currCorrAnsRank
  if (answersAreEqual(question.corrAnsIds, answerIds)) {
    question.currCorrAnsRank += 1;
  }

  let answerScore = null;
  if (!answersAreEqual(question.corrAnsIds, answerIds)) {
    answerScore = 0;
  } else {
    answerScore = Math.round((1 / question.currCorrAnsRank) * question.points);
  }
  const currPlayerResult = {
    playerId: playerId,
    playerName: playerFound.playerName,
    playerAnswer: answerIds,
    isItCorrect: answersAreEqual(question.corrAnsIds, answerIds),
    corrAnsRank: question.currCorrAnsRank,
    score: answerScore,
    timeTaken: ((timeNow - question.timeQuestionOpen) / 1000),
  };
  question.playerResults.push(currPlayerResult);

  // If all players have answered
  return {};
}

export function adminQuizCurrQuestionInfo(playerId: number, questionPosition: number) {
  const data: DataStore = getData();
  let playerIdFound = false;
  let quizSeshFound;
  let quizFound;
  for (const quiz of data.quizzes) {
    quizFound = quiz;
    for (const session of quiz.activeQuizSessions) {
      quizSeshFound = session;
      if (session.guests) {
        for (const player of session.guests) {
          if (player.playerId === playerId) {
            playerIdFound = true;
            break;
          }
        }
      }
    }
  }
  if (!playerIdFound) {
    throw HTTPError(400, 'Player ID does not exist');
  }
  if (quizFound.questions.length < questionPosition || questionPosition < 0) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }
  if (quizSeshFound.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }
  if (quizSeshFound.state === 'LOBBY' || quizSeshFound.state === 'QUESTION_COUNTDOWN' || quizSeshFound.state === 'END') {
    throw HTTPError(400, 'Session is in LOBBY, QUESTION_COUNTDOWN, or END state');
  }

  const answerArr = [];
  for (let i = 0; i < quizSeshFound.questions[questionPosition - 1].answers.length; i++) {
    const currAnswerObj = {
      answerId: quizSeshFound.questions[questionPosition - 1].answers[i].answerId,
      answer: quizSeshFound.questions[questionPosition - 1].answers[i].answer,
      colour: quizSeshFound.questions[questionPosition - 1].answers[i].colour,
    };
    answerArr.push(currAnswerObj);
  }
  const returnObject = {
    questionId: quizSeshFound.questions[questionPosition - 1].questionId,
    question: quizSeshFound.questions[questionPosition - 1].question,
    duration: quizFound.questions[questionPosition - 1].duration,
    points: quizFound.questions[questionPosition - 1].points,
    answers: answerArr,
  };

  return returnObject;
}

/**
 * Gets the results for a particular question of the session a player is playing in.
 *
 * @param {number} playerId - The ID of the player.
 * @param {number} questionPosition - The position of the question in the session.
 *
 * @returns {QuestionResultResponse} - The results of the question.
 * @returns {error}- Throws an error message.
 */
export function getQuestionResults(playerId: number, questionPosition: number): QuestionResultResponse | { error?: string } {
  const data: DataStore = getData();

  let playerIdFound = false;
  let quizSeshFound;
  let quizFound;

  // Loops through quizzes and their active sessions to find the specific player
  for (const quiz of data.quizzes) {
    quizFound = quiz;
    for (const session of quiz.activeQuizSessions) {
      quizSeshFound = session;
      if (session.guests) {
        for (const player of session.guests) {
          if (player.playerId === playerId) {
            playerIdFound = true;
            break;
          }
        }
      }
    }
  }

  // Throws an error if player ID does not exist
  if (!playerIdFound) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  // Throws an error if question position is not valid for the session this player is in
  if (quizFound.questions.length < questionPosition || questionPosition < 0) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  // Throws an error if session is not in ANSWER_SHOW state
  if (quizSeshFound.state !== 'ANSWER_SHOW') {
    throw HTTPError(400, 'Session is not in ANSWER_SHOW state');
  }

  // Throws an error if session is not yet up to this question
  if (quizSeshFound.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }

  const questionResult = quizSeshFound.questions[questionPosition - 1];

  // Calculates the total time taken to answer a question
  let totalTimeTaken = 0;
  const playerResults = questionResult.playerResults;
  for (let index = 0; index < playerResults.length; index++) {
    totalTimeTaken += playerResults[index].timeTaken;
  }

  // Calculates the average answer time
  const averageAnswerTime = Math.floor(playerResults.length > 0 ? totalTimeTaken / playerResults.length : 0);
  const playersCorrectList = [];

  // Adds the player's name to playersCorrectList if they answered correctly
  for (const result of questionResult.playerResults) {
    if (result.isItCorrect) {
      playersCorrectList.push(result.playerName);
    }
  }

  // Calculates the percentage of correct answers
  const percentCorrect = Math.floor((playersCorrectList.length / questionResult.playerResults.length) * 100);

  // Returns QuestionResultResponse
  return {
    questionId: questionResult.questionId,
    playersCorrectList: playersCorrectList,
    averageAnswerTime: averageAnswerTime,
    percentCorrect: percentCorrect
  };
}

// Function to send a chat message in a quiz session
export function sendMsgInSession(playerId: number, messageBody: MessageBody) {
  const data = getData();
  let playerFound = false;

  // Find the session where the player is present
  for (const quiz of data.quizzes) {
    for (const session of quiz.activeQuizSessions) {
      for (const player of session.guests) {
        if (player.playerId === playerId) {
          playerFound = true;
          if (messageBody.message.length < 1 || messageBody.message.length > 100) {
            throw HTTPError(400, 'Message body must be between 1 and 100 characters');
          }
          if (!session.message) {
            session.message = [];
          }
          session.message.push({
            message: messageBody.message,
            playerId: player.playerId,
            playerName: player.playerName,
            timeSent: Math.floor(Date.now() / 1000) // Current time in Unix timestamp
          });

          setData(data);
          return {};
        }
      }
    }
  }

  if (!playerFound) {
    throw HTTPError(400, 'Player ID does not exist');
  }
}

// Function to get all chat messages in the same session as the player
export function getChatMessages(playerId: number): MessageBody[] | { error?: string } {
  const data = getData();
  const messages = [];
  let playerFound = false;

  // Loop through quizzes to find the player's session
  for (const quiz of data.quizzes) {
    for (const session of quiz.activeQuizSessions) {
      // Check each guest to see if the player is in the current session
      for (const player of session.guests) {
        if (player.playerId === playerId) {
          playerFound = true;
          for (const msg of session.message) {
            messages.push({
              message: msg.message,
              playerId: msg.playerId,
              playerName: msg.playerName,
              timeSent: msg.timeSent
            });
          }
          break;
        }
      }
      if (playerFound) {
        break;
      }
    }
    if (playerFound) {
      break;
    }
  }

  if (!playerFound) {
    return { error: 'Player ID does not exist' };
  }

  const n = messages.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (messages[j].timeSent > messages[j + 1].timeSent) {
        [messages[j], messages[j + 1]] = [messages[j + 1], messages[j]];
      }
    }
  }

  return messages;
}

/**
 * Gets the a link to the final results (in CSV format) for all players for a completed quiz session.
 *
 * @param {string} token - The ID of the player.
 * @param {number} quizId - The position of the question in the session.
 * @param {number} sessionId - The position of the question in the session.
 *
 * @returns {string} - URL.
 * @returns {error} - Throws an error message.
 */
export function getQuizSessionFinalResultsCSV(token: string, quizId: number, sessionId: number): QuizSessionFinalResultsCSV | { error?: string } {
  // Gets the data
  const data: DataStore = getData();

  const authUserId = checkSessionExists(token, data);

  // Throws an error if the token does not exist in any session
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId);

  // Calls isQuizExist and throws an error if quizId is invalid
  if (!isQuizExist(data, quizId)) {
    throw HTTPError(401, 'QuizId does not refer to a valid quiz');
  }

  // Calls isQuizOwner and throws an error when a valid token is provided, but the user is not the owner of this quiz
  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'QuizId does not refer to a quiz that this user owns');
  }

  const session = quiz.activeQuizSessions.find(sess => sess.sessionId === sessionId);

  // Throws an error if session ID does not refer to a valid session within this quiz
  if (!session) {
    throw HTTPError(400, 'Session ID does not refer to a valid session within this quiz');
  }

  // Throws an error if session is not in FINAL_RESULTS state
  if (session.state !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  // Constructs the URL in csv format
  const baseUrl = 'http://example.com';
  const url = `${baseUrl}/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`;

  return {
    url: url
  };
}

/**
 * Gets the results for a particular question of the session a player is playing in.
 *
 * @param {string} token - The ID of the player.
 * @param {number} quizId - The position of the question in the session.
 * @param {number} sessionId - The position of the question in the session.
 *
 * @returns {QuestionResultResponse} - The results of the question.
 * @returns {error}- Throws an error message.
 */
export function getQuizSessionFinalResults(token: string, quizId: number, sessionId: number): QuizSessionFinalResults | { error?: string } {
  // Gets the data
  const data: DataStore = getData();

  const authUserId = checkSessionExists(token, data);

  // Throws an error if the token does not exist in any session
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId);

  // Calls isQuizExist and throws an error if quizId is invalid
  if (!isQuizExist(data, quizId)) {
    throw HTTPError(401, 'QuizId does not refer to a valid quiz');
  }

  // Calls isQuizOwner and throws an error when a valid token is provided, but the user is not the owner of this quiz
  if (!isQuizOwner(data, quizId, authUserId)) {
    throw HTTPError(403, 'QuizId does not refer to a quiz that this user owns');
  }

  const session = quiz.activeQuizSessions.find(sess => sess.sessionId === sessionId);

  // Throws an error if session ID does not refer to a valid session within this quiz
  if (!session) {
    throw HTTPError(400, 'Session ID does not refer to a valid session within this quiz');
  }

  // Throws an error if session is not in FINAL_RESULTS state
  if (session.state !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  const usersRankedByScore = [];

  for (const guest of session.guests) {
    let totalScore = 0;

    for (const question of session.questions) {
      const playerResult = question.playerResults.find(pr => pr.playerId === guest.playerId);
      if (playerResult) {
        totalScore += playerResult.score;
      }
    }
    usersRankedByScore.push({ name: guest.playerName, score: totalScore });
  }

  // Sorting the scores
  usersRankedByScore.sort((a, b) => b.score - a.score);

  // Calculating question results
  const questionResults = [];
  for (const question of session.questions) {
    const playersCorrectList = [];
    let totalAnswerTime = 0;
    let correctAnswers = 0;
    for (const player of question.playerResults) {
      if (player.isItCorrect) {
        playersCorrectList.push(player.playerName);
        correctAnswers++;
      }
      totalAnswerTime += player.timeTaken;
    }

    // Calculates averageAnswerTime and percentCorrect
    const averageAnswerTime = Math.floor(question.playerResults.length > 0 ? totalAnswerTime / question.playerResults.length : 0);
    const percentCorrect = Math.floor(question.playerResults.length > 0 ? (correctAnswers / question.playerResults.length) * 100 : 0);

    // Pushing questionResults
    questionResults.push({
      questionId: question.questionId,
      playersCorrectList: playersCorrectList,
      averageAnswerTime: averageAnswerTime,
      percentCorrect: percentCorrect
    });
  }

  // Returns usersRankedByScore and questionResults
  return {
    usersRankedByScore: usersRankedByScore,
    questionResults: questionResults
  };
}

/**
 * Gets the results for a particular question of the session a player is playing in.
 *
 * @param {number} playerId - The position of the question in the session.
 *
 * @returns {QuizSessionFinalResults} - The results of the question.
 * @returns {error}- Throws an error message.
 */
export function getPlayerFinalResults(playerId: number): QuizSessionFinalResults | { error?: string } {
  const data: DataStore = getData();
  let quizSession;
  let playerFound = false;

  // Search through quizzes to find the session containing the player
  for (const quiz of data.quizzes) {
    for (const session of quiz.activeQuizSessions || []) {
      for (const guest of session.guests) {
        if (guest.playerId === playerId) {
          playerFound = true;
        } if (session.state === 'FINAL_RESULTS') {
          quizSession = session;
        }
      }
      if (playerFound) {
        break;
      }
    }
    if (playerFound) {
      break;
    }
  }

  if (!playerFound) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  if (!quizSession) {
    throw HTTPError(400, 'Session is not in FINAL RESULTS state');
  }

  // Initialize players' scores
  for (const guest of quizSession.guests) {
    guest.totalScore = 0; // Initialize score
  }

  // Calculate scores and accumulate question results
  const questionResults = [];
  for (const question of quizSession.questions) {
    let totalTimeTaken = 0;
    let totalCorrectAnswers = 0;
    const playersCorrectList = [];

    for (const result of question.playerResults) {
      totalTimeTaken += result.timeTaken;
      if (result.isItCorrect) {
        totalCorrectAnswers++;
        for (const guest of quizSession.guests) {
          if (guest.playerId === result.playerId) {
            guest.totalScore += result.score;
            playersCorrectList.push(guest.playerName);
          }
        }
      }
    }

    const averageAnswerTime = question.playerResults.length > 0 ? Math.round(totalTimeTaken / question.playerResults.length) : 0;
    const percentCorrect = question.playerResults.length > 0 ? Math.round((totalCorrectAnswers / question.playerResults.length) * 100) : 0;

    questionResults.push({
      questionId: question.questionId,
      playersCorrectList: playersCorrectList,
      averageAnswerTime: averageAnswerTime,
      percentCorrect: percentCorrect
    });
  }

  // Sort players by their total score using .sort()
  const usersRankedByScore = quizSession.guests.map(guest => ({
    name: guest.playerName,
    score: guest.totalScore
  })).sort((a, b) => b.score - a.score);

  return {
    usersRankedByScore: usersRankedByScore,
    questionResults: questionResults
  };
}
