import { requestAdminAuthRegister, requestAdminUserDetails } from './authRequestFunctions';

import {
  requestAdminQuizCreate, requestAdminQuizRemove, requestAdminQuizInfo, requestAdminQuizList,
  requestAdminQuizDescriptionUpdate, requestAdminQuizNameUpdate, requestViewQuizInTrash,
  requestAdminQuizTransfer, requestAdminQuizQuestionCreate, requestUpdateQuizQuestion,
  requestDeleteQuizQuestion, requestRestoreQuizFromTrash, requestEmptyTrash,
  requestAdminQuizMoveQuestion, requestAdminQuizDuplicateQuestion, requestAdminQuizNewSession,
  requestAdminQuizGetQuizStatus, requestAdminQuizGuestJoin, requestAdminQuizUpdateSessionState,
  requestAdminQuizUpdateThumbnail, requestAdminQuizGuestStatus, requestAdminQuizSubmitPlayerAnswers,
  requestAdminQuizCurrQuestionInfo, requestAdminQuizViewSessions, requestGetQuestionResults,
  requestSendMsgInSession, requestGetChatMessages, requestGetQuizSessionFinalResultsCSV, requestGetQuizSessionFinalResults,
  requestGetPlayerFinalResults

} from './quizRequestFunctions';

import { Quiz, QuestionBody } from './dataStore';

import { requestClear } from './otherRequestFunction';

import sleepSync from 'slync';

beforeEach(() => {
  requestClear();
});

// Testing for adminQuizList
describe('adminQuizList', () => {
  test('Check if token is valid', () => {
    // Test with non-existing authUserId
    expect(requestAdminQuizList('-1')).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('No quizzes created by user', () => {
    const authUser = requestAdminAuthRegister('janedoe@gmail.com', '5678Def@#$', 'Alice', 'Smith');
    // Test with a user who hasn't created any quizzes
    expect(requestAdminQuizList(authUser.token)).toStrictEqual({ quizzes: [] });
  });

  test('Success Case: Returns all quizzes created by a specific user', () => {
    const authUser = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    // Test with a user who has created quizzes
    const quiz1 = requestAdminQuizCreate(authUser.token, 'Animals', 'The description');
    const quiz2 = requestAdminQuizCreate(authUser.token, 'History', 'The description');
    expect(requestAdminQuizList(authUser.token)).toStrictEqual({
      quizzes: [
        { name: 'Animals', quizId: quiz1.quizId },
        { name: 'History', quizId: quiz2.quizId }
      ]
    });
  });

  test('Success Case: Returns remaining quizzes after deleting a quiz', () => {
    const authUser = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    // Test when a quiz (quiz1) is deleted
    const quiz1 = requestAdminQuizCreate(authUser.token, 'Animals', 'The description');
    const quiz2 = requestAdminQuizCreate(authUser.token, 'History', 'The description');
    requestAdminQuizRemove(quiz1.quizId, authUser.token);
    expect(requestAdminQuizList(authUser.token)).toStrictEqual({
      quizzes: [
        { name: 'History', quizId: quiz2.quizId }
      ]
    });
  });
});

// Testing for adminQuizRemove
describe('adminQuizRemove', () => {
  test('Checks if token is empty or invalid (does not refer to valid logged in user session)', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    expect(requestAdminQuizRemove(quiz.quizId, '-1')).toStrictEqual({ error: 'Token is empty or invalid (does not refer to valid logged in user session' });
  });

  test('Checks if QuizId does not refer to a quiz that this user owns', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const userNotQuizOwner = requestAdminAuthRegister('NotOwner@gmail.com', 'Password99', 'Vedant', 'Tan');

    expect(requestAdminQuizRemove(quiz.quizId, userNotQuizOwner.token)).toStrictEqual({ error: 'Valid token is provided, but user is not an owner of this quiz' });
  });

  test('Success case, checks if token and QuizId are both valid and user also owns quiz', () => {
    const user = requestAdminAuthRegister('Nick2@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz2', 'description');
    const originalTimeLastEdited = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;

    expect(requestAdminQuizRemove(quiz.quizId, user.token)).toStrictEqual(
      {}
    );

    // Checks if quiz is removed correctly
    // quiz list should be an empty list
    expect(requestAdminQuizList(user.token)).toStrictEqual({ quizzes: [] });

    // checks if timeLastEdited was edited correctly
    expect(requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited !== originalTimeLastEdited);

    // quiz was sent to trash correctly and can be restored
    expect(requestRestoreQuizFromTrash(quiz.quizId, user.token)).toStrictEqual({});
  });

  test('Success case, removing multiple quizzes from different users', () => {
    const user = requestAdminAuthRegister('Nick1@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const user2 = requestAdminAuthRegister('Nick2@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz2 = requestAdminQuizCreate(user2.token, 'Quiz2', 'description');

    const user3 = requestAdminAuthRegister('Nick3@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz3 = requestAdminQuizCreate(user3.token, 'Quiz3', 'description');
    const quiz31 = requestAdminQuizCreate(user3.token, 'Quiz31', 'description');

    const user4 = requestAdminAuthRegister('Nick4@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz4 = requestAdminQuizCreate(user4.token, 'Quiz4', 'description');

    expect(requestAdminQuizRemove(quiz31.quizId, user3.token)).toStrictEqual(
      {}
    );
    expect(requestAdminQuizRemove(quiz3.quizId, user3.token)).toStrictEqual(
      {}
    );
    expect(requestAdminQuizRemove(quiz2.quizId, user2.token)).toStrictEqual(
      {}
    );
    expect(requestAdminQuizRemove(quiz4.quizId, user4.token)).toStrictEqual(
      {}
    );
    expect(requestAdminQuizRemove(quiz.quizId, user.token)).toStrictEqual(
      {}
    );

    // Check if quiz is removed correctly
    // quiz list should be an empty list
    expect(requestAdminQuizList(user.token)).toStrictEqual({ quizzes: [] });
  });
});

// Testing for adminQuizCreate
describe('adminQuizCreate', () => {
  test('Check if adminUserId exists', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    expect(requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.')).toStrictEqual({
      quizId: expect.any(Number),
    });
  });

  test('Checks if name has correct length', () => {
    const result1 = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeqeese', 'Veede');
    expect(requestAdminQuizCreate(result1.token, '', 'Quiz that asks questions about different animals.')).toStrictEqual({ error: 'The name length is invalid' });

    const result2 = requestAdminAuthRegister('johndo@gmail.com', '12345bc@#$', 'Zeeleese', 'Veete');
    expect(requestAdminQuizCreate(result2.token, ' ', 'Quiz that asks questions about different animals.')).toStrictEqual({ error: 'The name length is invalid' });

    const result3 = requestAdminAuthRegister('johnd@gmail.com', '1234A9c@#$', 'Zeepeese', 'Veere');
    expect(requestAdminQuizCreate(result3.token, 'AB', 'Quiz that asks questions about different animals.')).toStrictEqual({ error: 'The name length is invalid' });

    const result4 = requestAdminAuthRegister('john@gmail.com', '1234Ab1@#$', 'Zeeaeese', 'Veeue');
    expect(requestAdminQuizCreate(result4.token, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'Quiz that asks questions about different animals.')).toStrictEqual({ error: 'The name length is invalid' });
  });

  test('Checks if name contains valid characters', () => {
    const result1 = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Vepee');
    expect(requestAdminQuizCreate(result1.token, 'Animals', 'Quiz that asks questions about different animals.')).toStrictEqual({
      quizId: expect.any(Number),
    });

    const result2 = requestAdminAuthRegister('johndo@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    expect(requestAdminQuizCreate(result2.token, 'About Animals', 'Quiz that asks questions about different animals.')).toStrictEqual({
      quizId: expect.any(Number),
    });

    const result3 = requestAdminAuthRegister('johnd@gmail.com', '1234Abc@#$', 'Zeeeexse', 'Venee');
    expect(requestAdminQuizCreate(result3.token, 'About Animals 1', 'Quiz that asks questions about different animals.')).toStrictEqual({
      quizId: expect.any(Number),
    });

    const result4 = requestAdminAuthRegister('john@gmail.com', '1234Abc@#$', 'Zeeeqese', 'Veere');
    expect(requestAdminQuizCreate(result4.token, 'About Animal$', 'Quiz that asks questions about different animals.')).toStrictEqual(
      { error: 'The name contains invalid characters' }
    );
  });

  test('Checks if name already exists', () => {
    const result1 = requestAdminAuthRegister('johnde@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Vepee');
    requestAdminQuizCreate(result1.token, 'Animals', 'Quiz that asks questions about different animals.');
    expect(requestAdminQuizCreate(result1.token, 'Animals', 'Quiz that asks questions about different animals.')).toStrictEqual(
      { error: 'Quiz with the same name already exists' }
    );

    const result2 = requestAdminAuthRegister('jamesde@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Vepee');
    requestAdminQuizCreate(result2.token, 'Toys', 'Quiz that asks questions about different toys.');

    const result3 = requestAdminAuthRegister('Georgedo@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    expect(requestAdminQuizCreate(result3.token, 'Toys', 'Quiz that asks questions about different toys.')).toStrictEqual({ quizId: expect.any(Number) });
  });

  test('Checks if quizId is returning', () => {
    const result1 = requestAdminAuthRegister('johndo@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    expect(requestAdminQuizCreate(result1.token, 'Planes', 'Quiz that asks questions about different planes.')).toStrictEqual({
      quizId: expect.any(Number),
    });
  });

  test('Checks if description is valid', () => {
    const result1 = requestAdminAuthRegister('johndo@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    expect(requestAdminQuizCreate(result1.token, 'Planes', '')).toStrictEqual({
      quizId: expect.any(Number),
    });

    const result2 = requestAdminAuthRegister('Jamesbond@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    expect(requestAdminQuizCreate(result2.token,
      'Planes 2', 'Quiz that asks questions about different planes. You will really enjoy this quiz. Play it with your friends and family')).toStrictEqual(
      { error: 'Description is too long' }
    );

    const result3 = requestAdminAuthRegister('Helloworld@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    expect(requestAdminQuizCreate(result3.token, 'Planes 3', 'This quiz is about planes!')).toStrictEqual({
      quizId: expect.any(Number),
    });
  });

  test('Checks if the Quiz has been fixed correctly', () => {
    const result = requestAdminAuthRegister('johndo@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    const quizId1 = requestAdminQuizCreate(result.token, 'Planes', 'This quiz is about planes!');
    const QuizInfoReturn = requestAdminQuizInfo(result.token, quizId1.quizId);

    expect(QuizInfoReturn.quizId).toStrictEqual(quizId1.quizId);
    expect(QuizInfoReturn.name).toStrictEqual('Planes');
    expect(QuizInfoReturn.description).toStrictEqual('This quiz is about planes!');
  });
});

// Test for adminQuizInfo
describe('adminQuizInfo', () => {
  // Successful return case
  test('Successful return if no errors', () => {
    const user1 = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quiz1 = requestAdminQuizCreate(user1.token, 'thisQuiz', 'the Description');

    const quizDetails = requestAdminQuizInfo(user1.token, quiz1.quizId);

    // check all the fields if they're working as expected
    expect(quizDetails.quizId).toStrictEqual(quiz1.quizId);
    expect(quizDetails.name).toStrictEqual('thisQuiz');
    expect(quizDetails.timeCreated).toStrictEqual(expect.any(Number));
    expect(quizDetails.timeLastEdited).toStrictEqual(quizDetails.timeCreated);
    expect(quizDetails.description).toStrictEqual('the Description');
  });
  /// /////////////////////////////////
  // rigouros testing with adminQuizNameUpdate function
  test('Successful return with updated lastEditedTime', async() => {
    // clear();
    const user1 = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quiz1 = requestAdminQuizCreate(user1.token, 'thisQuiz', 'the Description');

    // Add a delay using setTimeout (just to make sure that time created and edited will be different)

    sleepSync(2000);
    const nameUpdateReturn = requestAdminQuizNameUpdate(user1.token, quiz1.quizId, 'thatQUiz');
    expect(nameUpdateReturn).toStrictEqual({});
    const quizDetails = requestAdminQuizInfo(user1.token, quiz1.quizId);

    // check all the fields for expected behavior
    expect(quizDetails.quizId).toStrictEqual(quiz1.quizId);
    expect(quizDetails.name).toStrictEqual('thatQUiz');
    expect(quizDetails.timeCreated).toStrictEqual(expect.any(Number));
    expect(quizDetails.timeLastEdited).not.toStrictEqual(quizDetails.timeCreated);
    expect(quizDetails.description).toStrictEqual('the Description');
  });

  // passing in -1 since authUserId will only be positive, so -1 is invalid id
  test('AuthUserId is not a valid user.', () => {
    const user = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quizId = requestAdminQuizCreate(user.token, 'thisQuiz', 'the Description');
    const quizDetails = requestAdminQuizInfo('-1', quizId.quizId);

    expect(quizDetails).toStrictEqual({ error: 'The following token does not exists' });
  });

  // dont create quiz, pass in -1 since quizId can only be positive
  test('Quiz ID does not refer to a valid quiz.', () => {
    const user = requestAdminAuthRegister('thisisemail1@gmail.com', 'and1Mndi', 'Terry', 'Mandiaki');
    const quizDetails = requestAdminQuizInfo(user.token, -1);

    expect(quizDetails).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  // creating two users, where random tried to access quiz owned not by them
  test('Quiz ID does not refer to a quiz that this user owns.', () => {
    const userRandom = requestAdminAuthRegister('thisisemail1@gmail.com', 'and1MnUi', 'fifiee', 'gigie');
    const userOwner = requestAdminAuthRegister('thisisowner@gmail.com', 'r22iunH2', 'ufgugs', 'jbhiohs');

    const quizId = requestAdminQuizCreate(userOwner.token, 'mitochondria', 'thisismi tochondria');

    const quizDetails = requestAdminQuizInfo(userRandom.token, quizId.quizId);
    expect(quizDetails).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  test('Creating question, then calling info', () => {
    const user = requestAdminAuthRegister('thisisemail1@gmail.com', 'and1MnUi', 'fifiee', 'gigie');
    const quiz = requestAdminQuizCreate(user.token, 'mitochondria', 'thisismi tochondria');

    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 20,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 25,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 15,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    };

    // creating questions
    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    const question2 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    const question3 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);

    const getDetails = requestAdminQuizInfo(user.token, quiz.quizId);

    expect(getDetails.quizId).toStrictEqual(quiz.quizId);
    expect(getDetails.name).toStrictEqual('mitochondria');
    expect(getDetails.timeCreated).toStrictEqual(expect.any(Number));
    expect(getDetails.timeLastEdited).toStrictEqual(getDetails.timeCreated);
    expect(getDetails.description).toStrictEqual('thisismi tochondria');

    // NOW check for other new fileds
    expect(getDetails.numQuestions).toEqual(3);
    expect(getDetails.questions[0].questionId).toEqual(question1.questionId);
    expect(getDetails.questions[1].questionId).toEqual(question2.questionId);
    expect(getDetails.questions[2].questionId).toEqual(question3.questionId);
    expect(getDetails.duration).toEqual(60);
  });
});

// Test for adminQuizNameUpdate
describe('adminQuizNameUpdate', () => {
  // pass in -1 as user, since -1 is always invalid
  test('AuthUserId is not a valid user.', () => {
    const user1 = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quizId = requestAdminQuizCreate(user1.token, 'thisQuiz', 'the Description');
    const quizDetails = requestAdminQuizNameUpdate('-1', quizId.quizId, 'new Name');

    expect(quizDetails).toStrictEqual({ error: 'The following token does not exists' });
  });

  // pass in -1 for quizId since -1 is always invalid
  test('Quiz ID does not refer to a valid quiz.', () => {
    const user = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quizDetails = requestAdminQuizNameUpdate(user.token, -1, 'non existing-quiz');
    expect(quizDetails).toStrictEqual({ error: 'QuizId is not valid' });
  });

  // creating two users, where random tried to access quiz owned not by them
  test('Quiz ID does not refer to a quiz that this user owns.', () => {
    const userRandom = requestAdminAuthRegister('thisisemail1@gmail.com', 'and1MnUi', 'fifiee', 'gigie');
    const userOwner = requestAdminAuthRegister('thisisowner@gmail.com', 'r22iunH2', 'ufgugs', 'jbhiohs');

    const quizId = requestAdminQuizCreate(userOwner.token, 'mitochondria', 'thisismi tochondria');
    const nameUpdate = requestAdminQuizNameUpdate(userRandom.token, quizId.quizId, 'new name');

    expect(nameUpdate).toStrictEqual({ error: 'You do not have access to this Quiz' });
  });

  // basic successful return case
  test('Successful return test', () => {
    const user = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quizId = requestAdminQuizCreate(user.token, 'Mitochondria', 'This is mitochondria');

    requestAdminQuizNameUpdate(user.token, quizId.quizId, 'Medulla Oblungata');
    const quizDetails = requestAdminQuizInfo(user.token, quizId.quizId);
    expect(quizDetails.name).toEqual('Medulla Oblungata');
  });

  test('Checks if name has correct length', () => {
    const user = requestAdminAuthRegister('didip2@gmail.com', '3RtiiI8jHjj', 'Fiennn', 'Fitrnnss');
    const quizId = requestAdminQuizCreate(user.token, 'mitochondria', 'description is good');

    // different length error checks for length of name
    expect(requestAdminQuizNameUpdate(user.token, quizId.quizId, 'Quiz that asks questions about different animals')).toStrictEqual({ error: 'The name length is invalid' });
    expect(requestAdminQuizNameUpdate(user.token, quizId.quizId, ' ')).toStrictEqual({ error: 'The name length is invalid' });
    expect(requestAdminQuizNameUpdate(user.token, quizId.quizId, 'AB')).toStrictEqual({ error: 'The name length is invalid' });
    expect(requestAdminQuizNameUpdate(user.token, quizId.quizId, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toStrictEqual({ error: 'The name length is invalid' });
  });

  // ~ and $ are invalid characters, testing for them below (non-alphanumeric)
  test('Checks if name contains valid characters', () => {
    const user = requestAdminAuthRegister('didip2@gmail.com', '3RtiiI8jHjj', 'Fiennn', 'Fitrnnss');
    const quizId = requestAdminQuizCreate(user.token, 'mitochondria', 'description is good');

    expect(requestAdminQuizNameUpdate(user.token, quizId.quizId, 'Quiz that$$~~~~~')).toStrictEqual({ error: 'The name contains invalid characters' });
  });

  // creating quiz with a same name as before
  test('Checks if name already exists', () => {
    const user1 = requestAdminAuthRegister('johnde@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Vepee');
    requestAdminQuizCreate(user1.token, 'Animals', 'Quiz that asks questions about different animals.');

    const user2 = requestAdminAuthRegister('johndo@gmail.com', '1234Abc@#$', 'Zeeezese', 'Veyee');
    const quizId2 = requestAdminQuizCreate(user2.token, 'Chocolates', 'Quiz that asks questions about different animals.');

    const nameUpdate = requestAdminQuizNameUpdate(user2.token, quizId2.quizId, 'Animals');
    expect(nameUpdate).toStrictEqual({ error: 'Quiz with the same name already exists' });
  });

  // Successful return case
  test('Successful return test', () => {
    const user = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quizId = requestAdminQuizCreate(user.token, 'Mitochondria', 'This is mitochondria');

    requestAdminQuizNameUpdate(user.token, quizId.quizId, 'Medulla Oblungata');
    const quizDetails = requestAdminQuizInfo(user.token, quizId.quizId);

    expect(quizDetails.name).toEqual('Medulla Oblungata');
  });

  // Rigouors testing with other functions, checks for timeLastEdited
  test('Successful return test', () => {
    const user1 = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    requestAdminQuizCreate(user1.token, 'Mitochondria', 'This is mitochondria');

    const user2 = requestAdminAuthRegister('plsHogaddi@gmail.com', 'Ui0iiggf7', 'Himaa', 'Challl');
    const quizId2 = requestAdminQuizCreate(user2.token, 'Brain', 'About Cerebral Cortex');

    // introducing a delay of 2 seconds to test if the timeLast Edited is different than timeCreated
    sleepSync(2000);
    const nameUpdate = requestAdminQuizNameUpdate(user2.token, quizId2.quizId, 'Cerebral Cortex');
    expect(nameUpdate).toStrictEqual({});

    const quizDetails = requestAdminQuizInfo(user2.token, quizId2.quizId);
    expect(quizDetails.name).toEqual('Cerebral Cortex');
    expect(quizDetails.timeLastEdited).not.toEqual(quizDetails.timeCreated);
  });
});

// Testing for adminQuizDescriptionUpdate
describe('adminQuizDescriptionUpdate', () => {
  test('Check if token exists', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId = requestAdminQuizCreate(result.token, 'Animals', 'the Description');
    expect(requestAdminQuizDescriptionUpdate('-1', quizId.quizId, 'Quiz that asks questions about different animals.')).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Check if quizId exists.', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    requestAdminQuizCreate(result.token, 'Animals', 'the Description');
    expect(requestAdminQuizDescriptionUpdate(result.token, -1, 'Quiz that asks questions about different animals.')).toStrictEqual({ error: 'QuizId does not refer to a valid quiz' });
  });

  test('Check if Quiz Id does not refer to a quiz that this user owns.', () => {
    const result1 = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId1 = requestAdminQuizCreate(result1.token, 'Animals', 'The description');
    const result2 = requestAdminAuthRegister('johndang@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');

    expect(requestAdminQuizDescriptionUpdate(result2.token, quizId1.quizId, 'Quiz that asks questions about different animals.')).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  test('Check if description length is valid.', () => {
    const result1 = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId1 = requestAdminQuizCreate(result1.token, 'Animals', 'The description');
    expect(requestAdminQuizDescriptionUpdate(result1.token, quizId1.quizId, 'Quiz that asks questions about different planes. You will really enjoy this quiz. Play it with your friends and family.')).toStrictEqual({ error: 'Description length is too long' });
  });

  test('Success Case', async () => {
    const result1 = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId1 = requestAdminQuizCreate(result1.token, 'Planes', 'The description');

    sleepSync(2000);
    expect(requestAdminQuizDescriptionUpdate(result1.token, quizId1.quizId, 'Quiz that asks questions about different planes')).toStrictEqual({});
    const quizDetails = requestAdminQuizInfo(result1.token, quizId1.quizId);
    expect(quizDetails.description).toStrictEqual('Quiz that asks questions about different planes');
    expect(quizDetails.timeLastEdited).not.toStrictEqual(quizDetails.timeCreated);
  });
});

// Testing for adminQuizQuestionUpdate
describe('adminQuizQuestionUpdate', () => {
  test('Checks if token is empty or invalid (does not refer to valid logged in user session)', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token + 1, updatedQuestionBody)).toStrictEqual(
      { error: 'Token is empty or invalid (does not refer to valid logged in user session)' }
    );
  });

  test('Checks if Question Id refers to a valid question within the quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId + 1, user.token, updatedQuestionBody)).toStrictEqual(
      { error: 'Question Id does not refer to a valid question within this quiz' }
    );
  });

  test('Checks if question string is less than 5 characters in length or greater than 50 characters in length', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const shortQuestionBody : QuestionBody = {
      question: 'Ques',
      duration: 4,
      points: 5,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    const longQuestionBody : QuestionBody = {
      question: 'Question is too longgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg',
      duration: 4,
      points: 5,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, shortQuestionBody)).toStrictEqual(
      { error: 'Question string is less than 5 characters in length or greater than 50 characters in length' }
    );
    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, longQuestionBody)).toStrictEqual(
      { error: 'Question string is less than 5 characters in length or greater than 50 characters in length' }
    );
  });

  test('Checks if the question has more than 6 answers or less than 2 answers', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const lowAnswerQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'only answer', correct: true },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const highAnswerQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: '1st too many answers', correct: true },
        { answer: '2nd too many answers', correct: false },
        { answer: '3rd too many answers', correct: false },
        { answer: '4th too many answers', correct: false },
        { answer: '5th too many answers', correct: false },
        { answer: '6th too many answers', correct: false },
        { answer: '7th too many answers', correct: false },
        { answer: '8th too many answers', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, lowAnswerQuestionBody)).toStrictEqual(
      { error: 'Question has more than 6 answers or less than 2 answers' }
    );
    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, highAnswerQuestionBody)).toStrictEqual(
      { error: 'Question has more than 6 answers or less than 2 answers' }
    );
  });

  test('Checks if the question duration is a positive number', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: -4,
      points: 5,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, updatedQuestionBody)).toStrictEqual(
      { error: 'The question duration is not a positive number' }
    );
  });

  test('Checks if the question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const firstQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 120, // 2 min = 120 seconds
      points: 5,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const secondQuestionBody : QuestionBody = {
      question: 'Question: What is 2 + 2?',
      duration: 2, // 120 + 2 = 122, 122 < 180 (3 min)
      points: 5,
      answers: [
        { answer: 'seven', correct: false },
        { answer: 'ten', correct: false },
        { answer: '69', correct: true },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, firstQuestionBody);
    const secondQuestion = requestAdminQuizQuestionCreate(user.token, quiz.quizId, secondQuestionBody);

    const updatedSecondQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 120, // 120 + 120 = 240, 240 > 180 (3 min), so invalid.
      points: 5,
      answers: [
        { answer: 'seven', correct: false },
        { answer: 'ten', correct: false },
        { answer: '69', correct: true },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, secondQuestion.questionId, user.token, updatedSecondQuestionBody)).toStrictEqual(
      { error: 'If the question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes' }
    );
  });

  test('Checks if the points awarded for the question are less than 1 or greater than 10', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const originalQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, originalQuestionBody);

    const lowPointsQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 0,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const highPointsQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 12,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, lowPointsQuestionBody)).toStrictEqual(
      { error: 'The points awarded for the question are less than 1 or greater than 10' }
    );
    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, highPointsQuestionBody)).toStrictEqual(
      { error: 'The points awarded for the question are less than 1 or greater than 10' }
    );
  });

  test('Checks if the length of any answer is shorter than 1 character long, or longer than 30 characters long', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const originalQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, originalQuestionBody);

    const shortAnswerQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: '', correct: true },
        { answer: '', correct: false },
        { answer: '', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const longAnswerQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: '1st TOO LONG OF AN ANSWER: AAAAAAAAAA', correct: true },
        { answer: '2nd TOO LONG OF AN ANSWER: AAAAAAAAAA', correct: false },
        { answer: '3rd TOO LONG OF AN ANSWER: AAAAAAAAAA', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, shortAnswerQuestionBody)).toStrictEqual(
      { error: 'The length of any answer is shorter than 1 character long, or longer than 30 characters long' }
    );
    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, longAnswerQuestionBody)).toStrictEqual(
      { error: 'The length of any answer is shorter than 1 character long, or longer than 30 characters long' }
    );
  });

  test('Checks if any answers strings are duplicates of one another (within the same question)', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'duplicate', correct: false },
        { answer: 'hi', correct: true },
        { answer: 'duplicate', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, updatedQuestionBody)).toStrictEqual(
      { error: 'Any answers strings are duplicates of one another (within the same question)' }
    );
  });

  test('Checks if there are correct answers', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'three', correct: false },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, updatedQuestionBody)).toStrictEqual(
      { error: 'There are no correct answers' }
    );
  });

  test('Checks if valid token is provided, but user is not an owner of this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const notOwnerUser = requestAdminAuthRegister('NotOwner@gmail.com', 'OldPass9999', 'Mic', 'Tan');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, notOwnerUser.token, updatedQuestionBody)).toStrictEqual(
      { error: 'Valid token is provided, but user is not an owner of this quiz' }
    );
  });

  test('Checks if the thumbnailUrl is an empty string', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: ''
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, updatedQuestionBody)).toStrictEqual(
      { error: 'The thumbnailUrl is an empty string' }
    );
  });

  test('Checks if the thumbnailUrl does not end with one of the following filetypes', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.invalid_filetype'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, updatedQuestionBody)).toStrictEqual(
      { error: 'The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png or thumbnailUr does not start with http:// or https://' }
    );
  });

  test('Checks if The thumbnailUrl does not begin with \'http://\' or \'https://\'', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const updatedQuestionBody : QuestionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'doesNotBeginWithHttp://google.com/some/image/path.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, updatedQuestionBody)).toStrictEqual(
      { error: 'The thumbnailUrl does not end with one of the following filetypes (case insensitive): jpg, jpeg, png or thumbnailUr does not start with http:// or https://' }
    );
  });

  test('Success case, check if quiz question is correctly updated', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz : Quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody : QuestionBody = {
      question: 'Original Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://google.com/OriginalImage.jpg'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const prevTimeLastEdited = requestAdminQuizInfo(user.token, quiz.quizId).questions[0].timeLastEdited;

    const UpdatedQuestionBody : QuestionBody = {
      question: 'Updated Question: What is 2 + 2?',
      duration: 10, // duration changed!
      points: 5, // question points changed!
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
      ],
      thumbnailUrl: 'http://google.com/UpdatedImage.jpg'
    };

    expect(requestUpdateQuizQuestion(quiz.quizId, question.questionId, user.token, UpdatedQuestionBody)).toStrictEqual(
      {}
    );

    // check if quiz question has been updated correctly
    const UpdatedQuestions = requestAdminQuizInfo(user.token, quiz.quizId).questions;

    // question details are correctly updated
    // questionId should not have changed
    expect(UpdatedQuestions[0].questionId === question.questionId);
    expect(UpdatedQuestions[0].question === 'Updated Question: What is 2 + 2?');
    expect(UpdatedQuestions[0].duration === 10);
    expect(UpdatedQuestions[0].points === 5);
    expect(UpdatedQuestions[0].thumbnailUrl === 'http://google.com/UpdatedImage.jpg');
    expect(UpdatedQuestions[0].answers === question.questionId);
    expect(UpdatedQuestions[0].answers.length === 2);
    // timeLastEdited field should be updated
    expect(UpdatedQuestions[0].timeLastEdited !== prevTimeLastEdited);
  });
});

// Testing for adminQuizQuestionDelete
describe('adminQuizQuestionDelete', () => {
  test('Checks if Question Id does refers to a valid question within this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    const session : {sessionId: number } = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    // session is in END state now
    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'END');

    expect(requestDeleteQuizQuestion(quiz.quizId, question.questionId + 1, user.token)).toStrictEqual(
      { error: 'Question Id does not refer to a valid question within this quiz' }
    );
  });

  test('Checks if token is empty or invalid (does not refer to a valid logged in user session)', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    const session : {sessionId: number } = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    // session is in END state now
    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'END');

    expect(requestDeleteQuizQuestion(quiz.quizId, question.questionId, user.token + 1)).toStrictEqual(
      { error: 'Token is empty or invalid (does not refer to valid logged in user session)' }
    );
  });

  test('Checks if valid token is provided, but user is not an owner of this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const notOwnerUser = requestAdminAuthRegister('NotOwner@gmail.com', 'OldPass999', 'Mic', 'Tan');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    const session : {sessionId: number } = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    // session is in END state now
    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'END');

    expect(requestDeleteQuizQuestion(quiz.quizId, question.questionId, notOwnerUser.token)).toStrictEqual(
      { error: 'Valid token is provided, but user is not an owner of this quiz' }
    );
  });

  test('Checks if any session for this quiz is not in END state', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    // in LOBBY state, not in END state
    requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const otherSession : {sessionId: number } = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    requestAdminQuizUpdateSessionState(quiz.quizId, otherSession.sessionId, user.token, 'END');

    expect(requestDeleteQuizQuestion(quiz.quizId, question.questionId, user.token)).toStrictEqual(
      { error: 'Any session for this quiz is not in END state' }
    );
  });

  test('Success case, check if quiz question is correctly deleted', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    const session : {sessionId: number } = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    // session is in END state now
    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'END');

    expect(requestDeleteQuizQuestion(quiz.quizId, question.questionId, user.token)).toStrictEqual(
      {}
    );

    // check if quiz question has been deleted correctly, the questionId passed in should no longer be valid
    expect(requestDeleteQuizQuestion(quiz.quizId, question.questionId, user.token)).toStrictEqual(
      { error: 'Question Id does not refer to a valid question within this quiz' }
    );
  });
});

// Testing for viewQuizInTrash
describe('viewQuizInTrash', () => {
  test('Check if valid token is passed into the function', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId = requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.');

    requestAdminQuizRemove(quizId.quizId, result.token);
    expect(requestViewQuizInTrash('-1')).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Check if trash is empty when no quiz is deleted or created', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    expect(requestViewQuizInTrash(result.token)).toStrictEqual({ quizzes: [] });
  });

  test('Check if one removed quiz is inside the trash', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId = requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.');
    const quizInfo = requestAdminQuizInfo(result.token, quizId.quizId);

    requestAdminQuizRemove(quizId.quizId, result.token);

    expect(requestViewQuizInTrash(result.token)).toStrictEqual({
      quizzes: [{
        quizId: quizInfo.quizId,
        name: quizInfo.name,
      }]
    });
  });

  test('Check if multiple removed quizzes from same user are inside the trash', () => {
    const result1 = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId1 = requestAdminQuizCreate(result1.token, 'Animals', 'Quiz that asks questions about different animals.');
    const quizId2 = requestAdminQuizCreate(result1.token, 'Planes', 'Quiz that asks questions about different planes.');
    const quizId3 = requestAdminQuizCreate(result1.token, 'Fruits', 'Quiz that asks questions about different fruits.');

    const quizInfo1 = requestAdminQuizInfo(result1.token, quizId1.quizId);
    const quizInfo2 = requestAdminQuizInfo(result1.token, quizId2.quizId);
    const quizInfo3 = requestAdminQuizInfo(result1.token, quizId3.quizId);

    requestAdminQuizRemove(quizId1.quizId, result1.token);
    requestAdminQuizRemove(quizId2.quizId, result1.token);
    requestAdminQuizRemove(quizId3.quizId, result1.token);

    expect(requestViewQuizInTrash(result1.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quizInfo1.quizId,
          name: quizInfo1.name,
        },
        {
          quizId: quizInfo2.quizId,
          name: quizInfo2.name,
        },
        {
          quizId: quizInfo3.quizId,
          name: quizInfo3.name,
        }
      ]
    });
  });

  test('Check if multiple removed quizzes from different user are inside the trash', () => {
    const result1 = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId1 = requestAdminQuizCreate(result1.token, 'Animals', 'Quiz that asks questions about different animals.');
    requestAdminQuizCreate(result1.token, 'Planes', 'Quiz that asks questions about different planes.');

    const result2 = requestAdminAuthRegister('jamesdoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId3 = requestAdminQuizCreate(result2.token, 'Fruits', 'Quiz that asks questions about different fruits.');
    const quizId4 = requestAdminQuizCreate(result2.token, 'Veggies', 'Quiz that asks questions about different veggies.');

    const quizInfo1 = requestAdminQuizInfo(result1.token, quizId1.quizId);
    const quizInfo3 = requestAdminQuizInfo(result2.token, quizId3.quizId);
    const quizInfo4 = requestAdminQuizInfo(result2.token, quizId4.quizId);

    requestAdminQuizRemove(quizId1.quizId, result1.token);
    requestAdminQuizRemove(quizId3.quizId, result2.token);
    requestAdminQuizRemove(quizId4.quizId, result2.token);

    expect(requestViewQuizInTrash(result1.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quizInfo1.quizId,
          name: quizInfo1.name,
        }
      ]
    });

    expect(requestViewQuizInTrash(result2.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quizInfo3.quizId,
          name: quizInfo3.name,
        },
        {
          quizId: quizInfo4.quizId,
          name: quizInfo4.name,
        }
      ]
    });
  });
});

// Testing for adminQuizTransfer
describe('adminQuizTransfer', () => {
  test('Token is empty or invalid', () => {
    const user = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quizId = requestAdminQuizCreate(user.token, 'thisQuiz', 'the Description');
    const userEmail = 'someemail@example.com';
    const result = requestAdminQuizTransfer('-1', quizId.quizId, userEmail);
    expect(result).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('QuizID does not refer to a valid quiz', () => {
    const user = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const quizId = -1;
    const userEmail = 'newowner@example.com';
    const result = requestAdminQuizTransfer(user.token, quizId, userEmail);
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a valid quiz' });
  });

  test('Valid token provided, but user is not an owner of this quiz.', () => {
    const userRandom = requestAdminAuthRegister('thisisemail1@gmail.com', 'and1MnUi', 'fifiee', 'gigie');
    const userOwner = requestAdminAuthRegister('thisisowner@gmail.com', 'r22iunH2', 'ufgugs', 'jbhiohs');
    const quizId = requestAdminQuizCreate(userOwner.token, 'OriginalQuiz', 'Original description');
    const result = requestAdminQuizTransfer(userRandom.token, quizId.quizId, 'nonowner@example.com');
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  test('userEmail is not a real user', () => {
    const user = requestAdminAuthRegister('realuser@example.com', 'Password123', 'Real', 'User');
    const quizId = requestAdminQuizCreate(user.token, 'Quiz', 'Description of quiz');
    const result = requestAdminQuizTransfer(user.token, quizId.quizId, 'nameuser@example.com');
    expect(result).toStrictEqual({ error: 'userEmail is not a real user' });
  });

  test('userEmail is the current logged in user', () => {
    const user = requestAdminAuthRegister('loggedinuser@example.com', 'Password123', 'LoggedIn', 'User');
    const quizId = requestAdminQuizCreate(user.token, 'Quiz', 'Description of quiz');
    const result = requestAdminQuizTransfer(user.token, quizId.quizId, 'loggedinuser@example.com');
    expect(result).toStrictEqual({ error: 'userEmail is the current logged in user' });
  });

  test('Successful quiz transfer', () => {
    const owner = requestAdminAuthRegister('successfulllogin@hotpotdot.com', '1234abc@#$', 'Zeeeeee', 'Veeee');
    const newOwner = requestAdminAuthRegister('newowner@example.com', 'password123', 'NewOwner', 'User');
    const owner3 = requestAdminUserDetails(newOwner.token);
    const quizId = requestAdminQuizCreate(owner.token, 'TransferQuiz', 'Description');
    const result = requestAdminQuizTransfer(owner.token, quizId.quizId, owner3.user.email);
    expect(result).toStrictEqual({});
  });

  test('Quiz has sessions that are not in the END state', () => {
    const owner = requestAdminAuthRegister('owner@example.com', 'password123', 'OwnerFirstName', 'OwnerLastName');
    const newOwner = requestAdminAuthRegister('newowner@example.com', 'password123', 'NewOwnerFirstName', 'NewOwnerLastName');
    const owner3 = requestAdminUserDetails(newOwner.token);
    const quiz = requestAdminQuizCreate(owner.token, 'Quiz With Active Session', 'Description');
    const autoStartNum = 6;
    const quizId = quiz.quizId;
    const questionBody = {
      question: 'Is there a correct answer?',
      answers: [
        { answer: 'Nope', correct: false },
        { answer: 'Yes there is', correct: true }
      ],
      duration: 15,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg'
    };
    requestAdminQuizQuestionCreate(owner.token, quizId, questionBody);
    requestAdminQuizNewSession(quiz.quizId, owner.token, autoStartNum);
    const result = requestAdminQuizTransfer(owner.token, quiz.quizId, owner3.user.email);
    expect(result).toStrictEqual({ error: 'Any session for this quiz is not in END state' });
  });
});

describe('adminQuizQuestionCreate', () => {
  test('Token does not exist', () => {
    const questionBody = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'London', correct: false }
      ],
      duration: 30,
      points: 5,
      thumbnailUrl: 'http://example.com/paris.jpg'
    };
    const result = requestAdminQuizQuestionCreate('-1', 1, questionBody);
    expect(result).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Check for validity of quizID', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const questionBody = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'London', correct: false }
      ],
      duration: 30,
      points: 5,
      thumbnailUrl: 'http://example.com/london.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, -1, questionBody);
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a valid quiz' });
  });

  test('Check Quiz ownership', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const otherUser = requestAdminAuthRegister('other@example.com', 'password123', 'Other', 'User');
    const questionBody = {
      question: 'Does this user own the quiz?',
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ],
      duration: 30,
      points: 3,
      thumbnailUrl: 'http://example.com/quiz.jpg'
    };
    const result = requestAdminQuizQuestionCreate(otherUser.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  test('Check question string length', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'ME?',
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ],
      duration: 20,
      points: 3,
      thumbnailUrl: 'http://example.com/question.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'Question string is less than 5 characters in length or greater than 50 characters in length' });
  });

  test('Check for answer count', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is this a valid question?',
      answers: [{ answer: 'Yes', correct: true }],
      duration: 15,
      points: 2,
      thumbnailUrl: 'http://example.com/answers.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The question has more than 6 answers or less than 2 answers' });
  });

  test('Check for answer count', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is this a valid question?',
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false },
        { answer: "I'm not sure", correct: false },
        { answer: 'It depends on context', correct: false },
        { answer: 'Possibly', correct: false },
        { answer: "Can't say for sure", correct: false },
        { answer: 'I am never going to be sure', correct: false }
      ],
      duration: 15,
      points: 2,
      thumbnailUrl: 'http://example.com/answers.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The question has more than 6 answers or less than 2 answers' });
  });

  test('Check for question duration', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is this a timed question?',
      answers: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false }
      ],
      duration: -5,
      points: 1,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The question duration is not a positive number' });
  });

  test('Checking for total question duration', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Will this exceed the time limit?',
      answers: [
        { answer: 'Definitely', correct: true },
        { answer: 'Yes', correct: false }
      ],
      duration: 181,
      points: 2,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The sum of the question durations in the quiz exceeds 3 minutes' });
  });

  test('Check for points awarded for questions', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is this worth too many points?',
      answers: [
        { answer: 'Absolutely', correct: true },
        { answer: 'Not at all', correct: false }
      ],
      duration: 30,
      points: 15,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The points awarded for the question are less than 1 or greater than 10' });
  });

  test('Check for points awarded for questions', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is this worth too many points?',
      answers: [
        { answer: 'Absolutely', correct: true },
        { answer: 'Not at all', correct: false }
      ],
      duration: 30,
      points: 0.5,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The points awarded for the question are less than 1 or greater than 10' });
  });

  test('Check for answer length', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is the answer too long or too short?',
      answers: [
        { answer: '', correct: false },
        { answer: 'no it is not', correct: false }
      ],
      duration: 20,
      points: 5,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The length of an answer is less than 1 character long, or longer than 30 characters long' });
  });

  test('Check for answer length', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is the answer too long or too short?',
      answers: [
        { answer: 'This is an excessively long answer that surely exceeds the character limit set for an answer within this context.', correct: true },
        { answer: 'no it is not', correct: false }
      ],
      duration: 20,
      points: 5,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'The length of an answer is less than 1 character long, or longer than 30 characters long' });
  });

  test('Check for duplicate answers', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Are answers repeated?',
      answers: [
        { answer: 'Repeat', correct: false },
        { answer: 'Repeat', correct: true },
        { answer: 'Unique', correct: false }
      ],
      duration: 30,
      points: 4,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'Answer strings are duplicates of one another (within the same question)' });
  });

  test('Check for correct answers', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz.');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'Is there a correct answer?',
      answers: [
        { answer: 'Nope', correct: false },
        { answer: 'Not at all', correct: false }
      ],
      duration: 15,
      points: 2,
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'There are no correct answers' });
  });

  test('Check for empty thumbnail URL', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const result1 = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz');
    const quizId = result1.quizId;
    const questionBody = {
      question: 'What is the capital of France?',
      duration: 15,
      points: 2,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'London', correct: false }
      ],
      thumbnailUrl: ''
    };
    const result = requestAdminQuizQuestionCreate(user.token, quizId, questionBody);
    expect(result).toStrictEqual({ error: 'Thumbnail URL cannot be empty' });
  });

  test('Checks if thumbnail URL format is valid', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz');
    const invalidUrls = ['example.jpg', 'http://example.com/image.bmp', 'https://example.com/image.gif'];
    invalidUrls.forEach(url => {
      const questionBody = {
        question: 'What is the capital of Germany?',
        duration: 15,
        points: 2,
        answers: [
          { answer: 'Berlin', correct: true },
          { answer: 'Munich', correct: false }
        ],
        thumbnailUrl: url
      };
      const result = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
      expect(result).toStrictEqual({ error: 'Thumbnail URL must end with .jpg, .jpeg, .png and start with http:// or https://' });
    });
  });

  test('Successfully creates a question', () => {
    const user = requestAdminAuthRegister('test@example.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Sample Quiz', 'Description of sample quiz');
    const questionBody = {
      question: 'What is the capital of France?',
      duration: 15,
      points: 2,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'London', correct: false }
      ],
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    const result = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    expect(result).toStrictEqual({ questionId: result.questionId });
  });
});

describe('emptyTrash', () => {
  test('Checking if the trash is already empty', () => {
    const user1 = requestAdminAuthRegister('jhondoe@gmail.com', 'aH0nd999oe', 'Jhon', 'Doe');
    const quizId1 = requestAdminQuizCreate(user1.token, 'thisQuiz', 'the Description');

    expect(requestEmptyTrash(user1.token, JSON.stringify([quizId1.quizId]))).toStrictEqual(
      {
        error: 'One or more of the Quiz IDs is not currently in the trash'
      });
  });

  test('Check if valid token is passed into the function', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const quizId = requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.');
    requestAdminQuizRemove(quizId.quizId, result.token);

    expect(requestEmptyTrash('-1', JSON.stringify([quizId.quizId]))).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Checks if error is returned when one or more of the Quiz IDs is not currently in the trash', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');

    const quizId = requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.');
    const quizId2 = requestAdminQuizCreate(result.token, 'Plants', 'Quiz that asks questions about different Plants.');
    const quizId3 = requestAdminQuizCreate(result.token, 'Games', 'Quiz that asks questions about different Games.');

    // Why does changing the order of remove break the code
    requestAdminQuizRemove(quizId.quizId, result.token);
    requestAdminQuizRemove(quizId2.quizId, result.token);

    expect(requestEmptyTrash(result.token, JSON.stringify([quizId3.quizId, quizId2.quizId]))).toStrictEqual({ error: 'One or more of the Quiz IDs is not currently in the trash' });
  });

  test('Check if valid token is provided, but one or more of the Quiz IDs refers to a quiz not owned', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');
    const result2 = requestAdminAuthRegister('jamesdoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');

    const quizId = requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.');
    const quizId2 = requestAdminQuizCreate(result.token, 'Plants', 'Quiz that asks questions about different Plants.');
    const quizId3 = requestAdminQuizCreate(result2.token, 'Games', 'Quiz that asks questions about different Games.');

    requestAdminQuizRemove(quizId.quizId, result.token);
    requestAdminQuizRemove(quizId2.quizId, result.token);
    requestAdminQuizRemove(quizId3.quizId, result2.token);

    expect(requestEmptyTrash(result.token, JSON.stringify([quizId3.quizId, quizId2.quizId]))).toStrictEqual(
      {
        error: 'Some quizzes are not owned by you.'
      }
    );
  });

  // Fails when no quiz in trash. Need to fix that.
  test('Success Case with few quizzes removed', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');

    const quizId1 = requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.');
    const quizId2 = requestAdminQuizCreate(result.token, 'Plants', 'Quiz that asks questions about different plants.');
    const quizId3 = requestAdminQuizCreate(result.token, 'Games', 'Quiz that asks questions about different games.');
    const quizId4 = requestAdminQuizCreate(result.token, 'Toys', 'Quiz that asks questions about different toys.');

    requestAdminQuizRemove(quizId1.quizId, result.token); // Animal
    requestAdminQuizRemove(quizId2.quizId, result.token); // Plants
    requestAdminQuizRemove(quizId3.quizId, result.token); // Games
    requestAdminQuizRemove(quizId4.quizId, result.token); // Toys

    expect(requestViewQuizInTrash(result.token)).toStrictEqual({
      quizzes: [{ quizId: quizId1.quizId, name: 'Animals' },
        { quizId: quizId2.quizId, name: 'Plants' },
        { quizId: quizId3.quizId, name: 'Games' },
        { quizId: quizId4.quizId, name: 'Toys' }]
    });

    expect(requestEmptyTrash(result.token, JSON.stringify([quizId2.quizId, quizId4.quizId]))).toStrictEqual({});

    expect(requestViewQuizInTrash(result.token)).toStrictEqual({
      quizzes: [{ quizId: quizId1.quizId, name: 'Animals' },
        { quizId: quizId3.quizId, name: 'Games' }]
    });
  });

  test('Success Case with more number of quizzes removed', () => {
    const result = requestAdminAuthRegister('johndoe@gmail.com', '1234Abc@#$', 'Zeeeeese', 'Veeee');

    const quizId = requestAdminQuizCreate(result.token, 'Animals', 'Quiz that asks questions about different animals.');
    const quizId2 = requestAdminQuizCreate(result.token, 'Plants', 'Quiz that asks questions about different plants.');
    const quizId3 = requestAdminQuizCreate(result.token, 'Games', 'Quiz that asks questions about different games.');
    const quizId4 = requestAdminQuizCreate(result.token, 'Toys', 'Quiz that asks questions about different toys.');
    const quizId5 = requestAdminQuizCreate(result.token, 'Friends', 'Quiz that asks questions about different friends.');
    const quizId6 = requestAdminQuizCreate(result.token, 'Food', 'Quiz that asks questions about different food.');
    const quizId7 = requestAdminQuizCreate(result.token, 'Travel', 'Quiz that asks questions about different travel.');

    requestAdminQuizRemove(quizId.quizId, result.token);
    requestAdminQuizRemove(quizId2.quizId, result.token);
    requestAdminQuizRemove(quizId3.quizId, result.token);
    requestAdminQuizRemove(quizId4.quizId, result.token);
    requestAdminQuizRemove(quizId5.quizId, result.token);
    requestAdminQuizRemove(quizId6.quizId, result.token);
    requestAdminQuizRemove(quizId7.quizId, result.token);

    expect(requestViewQuizInTrash(result.token)).toStrictEqual({
      quizzes: [{ quizId: quizId.quizId, name: 'Animals' },
        { quizId: quizId2.quizId, name: 'Plants' },
        { quizId: quizId3.quizId, name: 'Games' },
        { quizId: quizId4.quizId, name: 'Toys' },
        { quizId: quizId5.quizId, name: 'Friends' },
        { quizId: quizId6.quizId, name: 'Food' },
        { quizId: quizId7.quizId, name: 'Travel' }]
    });

    expect(requestEmptyTrash(result.token, JSON.stringify([quizId.quizId, quizId4.quizId, quizId5.quizId]))).toStrictEqual({});

    expect(requestViewQuizInTrash(result.token)).toStrictEqual({
      quizzes: [
        { quizId: quizId2.quizId, name: 'Plants' },
        { quizId: quizId3.quizId, name: 'Games' },
        { quizId: quizId6.quizId, name: 'Food' },
        { quizId: quizId7.quizId, name: 'Travel' }
      ]
    });
  });
});

// Testing for restoreQuizFromTrash
describe('restoreQuizFromTrash', () => {
  test('Quiz ID refers to a quiz that is not currently in the trash', () => {
    const user = requestAdminAuthRegister('notintrash@example.com', 'password123', 'NotInTrash', 'User');
    const quizId = requestAdminQuizCreate(user.token, 'NotInTrashQuiz', 'Quiz 2');
    const quizId2 = requestAdminQuizCreate(user.token, 'TrashQuiz', 'Quiz 3');
    requestAdminQuizRemove(quizId2.quizId, user.token);

    expect(requestRestoreQuizFromTrash(quizId.quizId, user.token)).toStrictEqual({ error: 'Quiz ID refers to a quiz that is not currently in the trash' });
  });

  test('Trash is empty', () => {
    const user = requestAdminAuthRegister('notintrash@example.com', 'password123', 'NotInTrash', 'User');
    const quizId = requestAdminQuizCreate(user.token, 'NotInTrashQuiz', 'Quiz 4');
    requestAdminQuizCreate(user.token, 'TrashQuiz', 'Quiz 5');

    expect(requestRestoreQuizFromTrash(quizId.quizId, user.token)).toStrictEqual({ error: 'Trash is currently empty' });
  });

  test('Token is empty or invalid', () => {
    const quizId = -1;

    expect(requestRestoreQuizFromTrash(quizId, 'invalidtoken')).toStrictEqual({ error: 'Token is empty or invalid' });
  });

  // test('Valid token is provided, but user is not an owner of this quiz', () => {
  //   const user1 = requestAdminAuthRegister('owner@example.com', 'password123', 'Owner', 'User');
  //   const user2 = requestAdminAuthRegister('notowner@example.com', 'password123', 'NotOwner', 'User');
  //   const quizId = requestAdminQuizCreate(user1.token, 'OwnershipQuiz', 'Quiz 6');

  //   requestAdminQuizRemove(quizId.quizId, user1.token);
  //   expect(requestRestoreQuizFromTrash(quizId.quizId, user2.token)).toStrictEqual({ error: 'Valid token is provided, but user is not an owner of this quiz' });
  // });

  test('Successfully restore a quiz from trash', () => {
    const user = requestAdminAuthRegister('restoreuser@example.com', 'password123', 'Restore', 'User');
    const quizId = requestAdminQuizCreate(user.token, 'RestoreQuiz', 'Quiz 7');

    requestAdminQuizRemove(quizId.quizId, user.token);
    expect(requestRestoreQuizFromTrash(quizId.quizId, user.token)).toStrictEqual({});
  });

  test('Successfully restore a quiz from trash and verify it is added back to the main quiz array', () => {
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quizId = requestAdminQuizCreate(user.token, 'Restore quiz to main', 'Quiz 8');

    requestAdminQuizRemove(quizId.quizId, user.token);

    expect(requestRestoreQuizFromTrash(quizId.quizId, user.token)).toStrictEqual({});

    const quizzes = requestAdminQuizList(user.token);
    expect(quizzes.quizzes).toContainEqual({ quizId: quizId.quizId, name: 'Restore quiz to main' });
  });
});

describe('adminQuizMoveQuestion', () => {
  test('Simple success Case: (Check if function returns empty object)', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody4 = {
      question: 'Are answers repeated (No)?',
      answers: [
        { answer: 'Repeat', correct: false },
        { answer: 'No', correct: true },
        { answer: 'Unique', correct: false }
      ],
      duration: 10,
      points: 4,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    // create qquestions
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    const question3 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody4);

    // move the question 3 on index 2 to index 1

    const questionMove = requestAdminQuizMoveQuestion(user.token, quiz.quizId, question3.questionId, 1);

    expect(questionMove).toStrictEqual({});
  });

  test('Complex success Case: (Check by calling adminQuizInfo function AND move same question twice)', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody4 = {
      question: 'How are you bro?',
      answers: [
        { answer: 'bad', correct: false },
        { answer: 'terrible', correct: true },
        { answer: 'just kms tbh', correct: false }
      ],
      duration: 10,
      points: 4,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    // create qquestions
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);
    const question4 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody4);

    // move the question4 on index 3 to index 1
    const questionMove = requestAdminQuizMoveQuestion(user.token, quiz.quizId, question4.questionId, 1);
    expect(questionMove).toStrictEqual({});

    // check with adminQuizInfo function if the question move to correct place:
    const quizDetails1 = requestAdminQuizInfo(user.token, quiz.quizId);

    // if questionId in the dataStore matches the questionId of question4, then it has been moved successfully
    expect(quizDetails1.questions[1].questionId).toEqual(question4.questionId);

    // move the question4 on index 1 to index 2
    const questionMove2 = requestAdminQuizMoveQuestion(user.token, quiz.quizId, question4.questionId, 2);
    expect(questionMove2).toStrictEqual({});
    // check with adminQUizInfo functionif the quesitonmove to corretc place:
    const quizDetails2 = requestAdminQuizInfo(user.token, quiz.quizId);

    // if th questionid in the dataStore matcnes the questionId of question4, then it has  been moved successfully
    expect(quizDetails2.questions[2].questionId).toEqual(question4.questionId);
  });

  test('Question Id does not refer to a valid question within this quiz', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);

    const result = requestAdminQuizMoveQuestion(user.token, quiz.quizId, -1, 0);
    expect(result).toStrictEqual({ error: 'Question not found' });
  });

  test('NewPosition is less than 0', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);

    // move the question1 on index 0 to index -3 (INVALID)

    const questionMove = requestAdminQuizMoveQuestion(user.token, quiz.quizId, question1.questionId, -3);
    expect(questionMove).toStrictEqual({ error: 'Invalid new position' });
  });

  test('NewPosition is greater than length of questions array', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);

    // move the question1 on index 3 to index 5 (INVALID)

    const questionMove = requestAdminQuizMoveQuestion(user.token, quiz.quizId, question1.questionId, 5);
    expect(questionMove).toStrictEqual({ error: 'Invalid new position' });
  });

  test('NewPosition is the position of the current question', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);

    // move the question1 on index 3 to index 0 (INVALID: it is on index 0)

    const questionMove = requestAdminQuizMoveQuestion(user.token, quiz.quizId, question1.questionId, 0);

    expect(questionMove).toStrictEqual({ error: 'The new position entered is the current position of the question' });
  });

  test('Token is empty or invalid (does not refer to valid logged in user session)', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);

    // move the question1 on index 3 to index 0 (INVALID: it is on index 0)
    // PASS invalid token
    const questionMove = requestAdminQuizMoveQuestion('-1', quiz.quizId, question1.questionId, 2);

    expect(questionMove).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Valid token is provided, but user is not an owner of this quiz', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('thisisemail1@gmail.com', 'and1MnUi', 'fifiee', 'gigie');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);

    // move the question1 on index 3 to index 0 (INVALID: it is on index 0)
    // PASS random user
    const userRandom = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const questionMove = requestAdminQuizMoveQuestion(userRandom.token, quiz.quizId, question1.questionId, 2);

    expect(questionMove).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });
});

describe('adminQuizDuplicateQuestion', () => {
  test('Success Case', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody4 = {
      question: 'How are you bro?',
      answers: [
        { answer: 'bad', correct: false },
        { answer: 'terrible', correct: true },
        { answer: 'just kms tbh', correct: false }
      ],
      duration: 10,
      points: 4,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    // create qquestions
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);

    const question2 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody4);
    requestAdminQuizDuplicateQuestion(user.token, quiz.quizId, question2.questionId);

    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    // One question will increase by duplicating the question

    expect(quizInfo.numQuestions).toBe(5);
  });

  test('Success case: Double duplicate and check questionId change', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody3 = {
      question: 'What is the chemical symbol for water?',
      answers: [
        { answer: 'H2O', correct: true },
        { answer: 'CO2', correct: false },
        { answer: 'NaCl', correct: false }
      ],
      duration: 10,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody4 = {
      question: 'How are you bro?',
      answers: [
        { answer: 'bad', correct: false },
        { answer: 'terrible', correct: true },
        { answer: 'just kms tbh', correct: false }
      ],
      duration: 10,
      points: 4,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    // create qquestions
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    const question2 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody4);

    /// DOUBLE DUPLICATE
    const questionDup1 = requestAdminQuizDuplicateQuestion(user.token, quiz.quizId, question2.questionId);
    const questionDup2 = requestAdminQuizDuplicateQuestion(user.token, quiz.quizId, question2.questionId);

    // check different questionId
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    expect(quizInfo.questions[1].questionId).not.toEqual(questionDup1.questionId);
    expect(quizInfo.questions[2].questionId).not.toEqual(questionDup2.questionId);

    // number of questions should be 6, 3 of which will be same.
    expect(quizInfo.numQuestions).toBe(6);
  });

  test('Question Id does not refer to a valid question within this quiz', () => {
    // Create users and quiz
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    const result = requestAdminQuizDuplicateQuestion(user.token, quiz.quizId, -1);

    expect(result).toStrictEqual({ error: 'Question not found' });
  });

  test('Token is empty or invalid (does not refer to valid logged in user session)', () => {
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    const result = requestAdminQuizDuplicateQuestion('-1', quiz.quizId, question1.questionId);

    expect(result).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Valid token is provided, but user is not an owner of this quiz', () => {
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    const userRandom = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const result = requestAdminQuizDuplicateQuestion(userRandom.token, quiz.quizId, question1.questionId);

    expect(result).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  test('Valid token is provided, but user is not an owner of this quiz', () => {
    const user = requestAdminAuthRegister('restoreuser32@example.com', 'password123', 'Restore', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'this is a quiz', 'What are you doing?');

    // Ccreate question body
    const questionBody1 = {
      question: 'What is the capital of France?',
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      duration: 10,
      points: 5,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const questionBody2 = {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: [
        { answer: 'William Shakespeare', correct: true },
        { answer: 'Jane Austen', correct: false },
        { answer: 'Charles Dickens', correct: false }
      ],
      duration: 10,
      points: 8,
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    const userRandom = requestAdminAuthRegister('jhondoe@gmail.com', 'jH0nd999oe', 'Jhon', 'Doe');
    const result = requestAdminQuizDuplicateQuestion(userRandom.token, quiz.quizId, question1.questionId);

    expect(result).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });
});

// Testing for adminQuizViewSessions
describe('adminQuizViewSessions', () => {
  test('Checks if token is empty or invalid (does not refer to valid logged in user session)', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    expect(requestAdminQuizViewSessions(user.token + 1, quiz.quizId)).toStrictEqual({ error: 'Token is empty or invalid (does not refer to valid logged in user session)' });
  });

  test('Checks if QuizId does not refer to a quiz that this user owns', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const userNotQuizOwner = requestAdminAuthRegister('NotOwner@gmail.com', 'Password99', 'Vedant', 'Tan');
    const autoStartNum = 5;
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    expect(requestAdminQuizViewSessions(userNotQuizOwner.token, quiz.quizId)).toStrictEqual({ error: 'Valid token is provided, but user is not an owner of this quiz' });
  });

  test('Success case, checks if active and inactive session ids for the quiz are returned correctly in ascending order', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const sortedActiveSessionIds = [];
    const sortedInactiveSessionIds = [];

    for (let i = 0; i < 5; i++) {
      sortedActiveSessionIds.push(requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum).sessionId);
    }

    for (let i = 0; i < 5; i++) {
      sortedInactiveSessionIds.push(requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum).sessionId);
    }

    for (const inactiveSessionId of sortedInactiveSessionIds) {
      requestAdminQuizUpdateSessionState(quiz.quizId, inactiveSessionId, user.token, 'END');
    }

    // sort the arrays
    sortedActiveSessionIds.sort((a, b) => a - b);
    sortedInactiveSessionIds.sort((a, b) => a - b);

    const activeSessions = sortedActiveSessionIds;
    const inactiveSessions = sortedInactiveSessionIds;

    // store sortedActiveSessionIds and sortedInactiveSessionIds as activeSessions and inactiveSessions
    // to match the name of the 2 arrays adminQuizViewSessions returns
    const sortedSessions = {
      activeSessions,
      inactiveSessions
    };

    expect(requestAdminQuizViewSessions(user.token, quiz.quizId)).toStrictEqual(sortedSessions);
  });

  test('Success case, checks if active and inactive session ids for the quiz are returned correctly, when no sessions are added at first, and then when active sessions are added, and when some active sessions are changed to inactive sessions', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    // these arrays are for testing against the function, to see if function returns correctly
    let sortedActiveSessionIds: number[] = [];
    let sortedInactiveSessionIds: number[] = [];

    // these arrays store the actual to be active or inactive session ids
    const sortedActualActiveSessionIds = [];
    const sortedActualInactiveSessionIds = [];

    let activeSessions = sortedActiveSessionIds;
    let inactiveSessions = sortedInactiveSessionIds;

    let sortedSessions = {
      activeSessions,
      inactiveSessions
    };

    // there are no session ids at first
    expect(requestAdminQuizViewSessions(user.token, quiz.quizId)).toStrictEqual(sortedSessions);

    for (let i = 0; i < 5; i++) {
      const activeSessionId = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum).sessionId;
      sortedActiveSessionIds.push(activeSessionId);

      sortedActualActiveSessionIds.push(activeSessionId);
    }

    for (let i = 0; i < 5; i++) {
      const inactiveSessionId = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum).sessionId;

      // these to-be inactive session Ids are active for now
      sortedActiveSessionIds.push(inactiveSessionId);

      sortedActualInactiveSessionIds.push(inactiveSessionId);
    }

    sortedActiveSessionIds.sort((a, b) => a - b);

    activeSessions = sortedActiveSessionIds;
    inactiveSessions = sortedInactiveSessionIds;

    sortedSessions = {
      activeSessions,
      inactiveSessions
    };

    expect(requestAdminQuizViewSessions(user.token, quiz.quizId)).toStrictEqual(sortedSessions);

    // to-be inactive session Ids which are still currently active, are changed to inactive session Ids
    for (const inactiveSessionId of sortedActualInactiveSessionIds) {
      expect(requestAdminQuizUpdateSessionState(quiz.quizId, inactiveSessionId, user.token, 'END')).toStrictEqual(
        {}
      );
    }

    // restore the 2 tested arrays with the actual active and inactive session ids
    sortedActiveSessionIds = sortedActualActiveSessionIds;
    sortedInactiveSessionIds = sortedActualInactiveSessionIds;

    // sort the arrays
    sortedActiveSessionIds.sort((a, b) => a - b);
    sortedInactiveSessionIds.sort((a, b) => a - b);

    activeSessions = sortedActiveSessionIds;
    inactiveSessions = sortedInactiveSessionIds;

    sortedSessions = {
      activeSessions,
      inactiveSessions
    };

    expect(requestAdminQuizViewSessions(user.token, quiz.quizId)).toStrictEqual(sortedSessions);
  });
});

// Testing for adminQuizNewSession
describe('adminQuizNewSession', () => {
  test('Checks if token is empty or invalid (does not refer to valid logged in user session)', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    expect(requestAdminQuizNewSession(quiz.quizId, user.token + 1, autoStartNum)).toStrictEqual({ error: 'Token is empty or invalid (does not refer to valid logged in user session)' });
  });

  test('Checks if QuizId does not refer to a quiz that this user owns', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const userNotQuizOwner = requestAdminAuthRegister('NotOwner@gmail.com', 'Password99', 'Vedant', 'Tan');
    const autoStartNum = 5;
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    expect(requestAdminQuizNewSession(quiz.quizId, userNotQuizOwner.token, autoStartNum)).toStrictEqual({ error: 'Valid token is provided, but user is not an owner of this quiz' });
  });

  test('Checks if autoStartNum is a number greater than 50', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 60;
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    expect(requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum)).toStrictEqual({ error: 'autoStartNum is a number greater than 50' });
  });

  test('Checks if a maximum of 10 sessions that are not in END state currently exist for this quiz', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    for (let num = 0; num < 10; num++) {
      requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    }

    // For loop above already created 10 quiz sessions, the maximum amount
    // so creating another session should fail

    expect(requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum)).toStrictEqual(
      {
        error: 'A maximum of 10 sessions that are not in END state currently exist for this quiz'
      });
  });

  test('Checks if quiz has any questions in it', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    expect(requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum)).toStrictEqual({ error: 'The quiz does not have any questions in it' });
  });

  test('Checks if quiz is in trash', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    requestAdminQuizRemove(quiz.quizId, user.token);

    expect(requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum)).toStrictEqual({ error: 'The quiz is in trash' });
  });

  test('Success case, starts a new session for a quiz', () => {
    const user = requestAdminAuthRegister('Nick2@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Original quiz', 'Original description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    expect(typeof result.sessionId).toBe('number');

    // checks if session is correctly created
    expect(requestAdminQuizViewSessions(user.token, quiz.quizId).activeSessions.some((sessionId: number) => sessionId === result.sessionId)).toBe(true);

    // checks if edits to the quiz will correctly not affect active session
    requestAdminQuizNameUpdate(user.token, quiz.quizId, 'Updated quiz name');
    requestAdminQuizDescriptionUpdate(user.token, quiz.quizId, 'Updated description');

    // the quiz session's quiz name should not be "Updated quiz name"
    // same for quiz session's quiz description, it should not have changed
    const quizSessionStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, result.sessionId);
    expect(quizSessionStatus.metadata.name).toEqual('Original quiz');
    expect(quizSessionStatus.metadata.description).toEqual('Original description');
  });
});

// Testing for adminQuizUpdateSessionState
describe('adminQuizUpdateSessionState', () => {
  test('Checks if token is empty or invalid (does not refer to valid logged in user session)', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const autoStartNum = 5;
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token + 1, action)).toStrictEqual(
      { error: 'Token is empty or invalid (does not refer to valid logged in user session)' }
    );
  });

  test('Checks if valid token is provided, but user is not an owner of this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const notOwnerUser = requestAdminAuthRegister('NotOwner@gmail.com', 'OldPass999', 'Mic', 'Tan');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const autoStartNum = 5;
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, notOwnerUser.token, action)).toStrictEqual(
      { error: 'Valid token is provided, but user is not an owner of this quiz' }
    );
  });

  test('Checks if session Id refers to a valid session within the quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const sessionId = -1;

    const action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, sessionId, user.token, action)).toStrictEqual(
      { error: 'Session Id does not refer to a valid session within this quiz' }
    );
  });

  test('Checks if action provided is a valid Action enum', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const autoStartNum = 5;
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    const action = 'INVALID_ACTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action provided is not a valid Action enum' }
    );
  });

  test('Checks if action enum cannot be applied in the current state', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    const questionBody2 = {
      question: 'Question: What is 2 + 2?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    const questionBody3 = {
      question: 'Question: What is 1 + 12?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody3);

    const autoStartNum = 5;
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // Quiz Session should be at LOBBY state when first created
    // so it is unable to go to FINAL_RESULTS state with the action GO_TO_FINAL_RESULTS yet.
    let action = 'GO_TO_FINAL_RESULTS';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'SKIP_COUNTDOWN';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    // QUESTION_COUNTDOWN state

    const countdown = 3000;

    sleepSync(countdown); // wait 3 seconds

    // QUESTION_OPEN state
    action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'GO_TO_FINAL_RESULTS';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'SKIP_COUNTDOWN';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    // QUESTION_OPEN state

    action = 'NEXT_QUESTION';

    // quiz session state is now in QUESTION_OPEN after SKIP_COUNTDOWN, so NEXT_QUESTION action is unapplicable
    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'GO_TO_FINAL_RESULTS';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'SKIP_COUNTDOWN';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'GO_TO_ANSWER';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    // ANSWER_SHOW state

    action = 'SKIP_COUNTDOWN';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'GO_TO_ANSWER';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'GO_TO_FINAL_RESULTS';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    // FINAL_RESULTS state

    action = 'GO_TO_FINAL_RESULTS';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'SKIP_COUNTDOWN';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'GO_TO_ANSWER';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'END';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    // now in END state

    action = 'GO_TO_ANSWER';

    // no actions are valid in END state
    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'SKIP_COUNTDOWN';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'GO_TO_FINAL_RESULTS';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );

    action = 'END';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action)).toStrictEqual(
      { error: 'Action enum cannot be applied in the current state' }
    );
  });

  test('Success case, checks if quiz session state is correctly updated after sending SKIP_COUNTDOWN action command, and QUESTION_OPEN to ANSWER_SHOW to QUESTION_COUNTDOWN', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    const questionBody2 = {
      question: 'Question: What is 1 + 12?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',

      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    const autoStartNum = 5;
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    let action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    // checks if quiz session state is correctly updated to QUESTION_COUNTDOWN
    let quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('QUESTION_COUNTDOWN');

    action = 'SKIP_COUNTDOWN';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    sleepSync(questionBody1.duration); // wait 3 seconds

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('QUESTION_OPEN');

    action = 'GO_TO_ANSWER';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('ANSWER_SHOW');

    action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('QUESTION_COUNTDOWN');

    sleepSync(3000); // wait 3 seconds

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('QUESTION_OPEN');

    action = 'END';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('END');
  });

  test('Success case, checks if quiz session state is correctly updated to QUESTION_OPEN after 3 seconds of sending NEXT_QUESTION action command, and if its state (QUESTION_OPEN) is correctly updated to QUESTION_CLOSE after duration of question ends, and tests for other actions like GO_TO_ANSWER and GO_TO_FINAL_RESULTS', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };
    const questionBody2 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    const autoStartNum = 5;
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    let action = 'NEXT_QUESTION';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    // checks if quiz session state is correctly updated to QUESTION_COUNTDOWN
    let quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('QUESTION_COUNTDOWN');

    // atQuestion should be correctly incremeneted to next question
    expect(quizStatus.atQuestion === 1);

    const countdown = 3000;

    sleepSync(countdown);

    // session state should be QUESTION_OPEN after countdown is done
    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('QUESTION_OPEN');

    const duration = questionBody1.duration * 1000; // convert miliseconds to seconds

    sleepSync(duration);

    // session state should automatically change to QUESTION_CLOSE after duration
    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('QUESTION_CLOSE');

    action = 'GO_TO_ANSWER';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('ANSWER_SHOW');

    action = 'GO_TO_FINAL_RESULTS';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('FINAL_RESULTS');

    action = 'END';

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, action)).toStrictEqual(
      {}
    );

    quizStatus = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, session.sessionId);
    expect(quizStatus.state).toEqual('END');
  });
});

describe('adminQuizGetQuizStatus', () => {
  test('Success case (complex): Check multiple times for different status', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);

    const questionBody2 = {
      question: 'Question: What is 1 + 1000?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // Call the function to check status which is initialised to LOBBY
    const result1 = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    expect(result1.state).toEqual('LOBBY');
    expect(result1.atQuestion).toEqual(0);

    // Player add
    requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    let action = 'NEXT_QUESTION';
    // Update the state
    expect(requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, action)).toStrictEqual({});
    const result2 = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    // expect new status to be QUESTION_COUNTDOWN

    expect(result2.state).toEqual('QUESTION_COUNTDOWN');
    expect(result2.atQuestion).toEqual(1);

    action = 'SKIP_COUNTDOWN';
    // update the status
    expect(requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, action)).toStrictEqual({});
    const result3 = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    // expect new status to be QUESTION_OPEN

    expect(result3.state).toEqual('QUESTION_OPEN');
    expect(result2.atQuestion).toEqual(1);

    action = 'GO_TO_ANSWER';
    // update the status
    expect(requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, action)).toStrictEqual({});
    const result4 = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    // expect new status to be ANSWER_SHOW

    expect(result4.state).toEqual('ANSWER_SHOW');
    expect(result4.atQuestion).toEqual(1);
    expect(result4.players).toEqual(['player1']);

    // Check other fields
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);

    expect(result4.metadata).toStrictEqual(quizInfo);
  });

  test('Session Id does not refer to a valid session within this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    // const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    // NOT calling requestAdminQuizNewSession() because it is not a valid session id

    const result = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, -1);

    expect(result).toStrictEqual({ error: 'Session Id does not refer to a valid session within this quiz' });
  });

  test('Token is empty or invalid (does not refer to valid logged in user session)', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // invalid token passed
    const result = requestAdminQuizGetQuizStatus('-1', quiz.quizId, newSession.sessionId);

    expect(result).toStrictEqual({ error: 'Token is empty or invalid (does not refer to valid logged in user session)' });
  });

  test('Valid token is provided, but user is not an owner of this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create random user
    const randomUser = requestAdminAuthRegister('blahblah@gmail.com', 'OldPa777s99h', 'Github', 'Sucks');
    const result = requestAdminQuizGetQuizStatus(randomUser.token, quiz.quizId, newSession.sessionId);
    // random user is not the owner, so expect error
    expect(result).toStrictEqual({ error: 'Valid token is provided, but user is not an owner of this quiz' });
  });
});

// TESTING FOR adminQuizGuestJoin
describe('requestAdminQuizGuestJoin', () => {
  // Error cases
  test('Check if the name entered is unique', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    expect(player1).toStrictEqual({ playerId: expect.any(Number) });
    const player2 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    expect(player2).toStrictEqual({ error: 'The given name already exists' });
  });

  test('Check if a random name is generated when the name is empty', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const player1 = requestAdminQuizGuestJoin(result.sessionId, '');
    expect(player1).toStrictEqual({ playerId: expect.any(Number) });
  });

  test('Check if the sessionId is valid', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const player1 = requestAdminQuizGuestJoin(-1, 'Aryan');
    expect(player1).toStrictEqual({ error: 'Session Id does not refer to a valid session' });
  });

  test('Check if session is in LOBBY state', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const action = 'NEXT_QUESTION';
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, action);

    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');

    expect(player1).toStrictEqual({ error: 'The current state is not LOBBY' });
  });

  test('SUCCESS CASE: 1 active session, multiple players', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    expect(player1).toStrictEqual({ playerId: expect.any(Number) });

    const player2 = requestAdminQuizGuestJoin(result.sessionId, 'Nicholas');
    expect(player2).toStrictEqual({ playerId: expect.any(Number) });

    const player3 = requestAdminQuizGuestJoin(result.sessionId, 'Vedant');
    expect(player3).toStrictEqual({ playerId: expect.any(Number) });

    const player4 = requestAdminQuizGuestJoin(result.sessionId, 'Jay');
    expect(player4).toStrictEqual({ playerId: expect.any(Number) });
  });

  test('SUCCESS CASE: 1 Quiz, mutiple active session, multiple players', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const result2 = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    expect(player1).toStrictEqual({ playerId: expect.any(Number) });

    const player2 = requestAdminQuizGuestJoin(result.sessionId, 'Nicholas');
    expect(player2).toStrictEqual({ playerId: expect.any(Number) });

    const player3 = requestAdminQuizGuestJoin(result2.sessionId, 'Vedant');
    expect(player3).toStrictEqual({ playerId: expect.any(Number) });

    const player4 = requestAdminQuizGuestJoin(result2.sessionId, 'Jay');
    expect(player4).toStrictEqual({ playerId: expect.any(Number) });
  });

  test('SUCCESS CASE: Multiple Quizzes, mutiple active session, multiple players', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz1 = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const quiz2 = requestAdminQuizCreate(user.token, 'Quiz2', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz1.quizId, questionBody);
    requestAdminQuizQuestionCreate(user.token, quiz2.quizId, questionBody);

    const result = requestAdminQuizNewSession(quiz1.quizId, user.token, autoStartNum);
    const result2 = requestAdminQuizNewSession(quiz2.quizId, user.token, autoStartNum);

    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    expect(player1).toStrictEqual({ playerId: expect.any(Number) });

    const player2 = requestAdminQuizGuestJoin(result.sessionId, 'Nicholas');
    expect(player2).toStrictEqual({ playerId: expect.any(Number) });

    const player3 = requestAdminQuizGuestJoin(result2.sessionId, 'Vedant');
    expect(player3).toStrictEqual({ playerId: expect.any(Number) });

    const player4 = requestAdminQuizGuestJoin(result2.sessionId, 'Jay');
    expect(player4).toStrictEqual({ playerId: expect.any(Number) });
  });
});

// TESTING FOR adminQuizUpdateThumbnail
describe('adminQuizUpdateThumbnail', () => {
  // Error cases
  test('Check if invalid token is passed into the function', () => {
    const user = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const thumbnailUrl = 'http://aryan.jpg';

    const result = requestAdminQuizUpdateThumbnail(quiz.quizId, '-1', thumbnailUrl);
    expect(result).toStrictEqual({ error: 'The following token does not exists.' });
  });

  test('Check if the user is the owner of the quiz being edited', () => {
    const user1 = requestAdminAuthRegister('Nick@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const user2 = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass98', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user1.token, 'Quiz1', 'description');
    const thumbnailUrl = 'http://aryan.jpg';

    const result = requestAdminQuizUpdateThumbnail(quiz.quizId, user2.token, thumbnailUrl);
    expect(result).toStrictEqual({ error: 'You do not have access to this Quiz' });
  });

  const testCases = [
    { url: 'http://google.com/some/image/path.jpg', expected: {} },
    { url: 'https://banana/image/path.jpg', expected: {} },
    { url: 'http://google.com/some/image/path.jpeg', expected: {} },
    { url: 'http://apple.com/some/image/path.png', expected: {} },
    { url: 'https://1.png', expected: {} },
    { url: '', expected: { error: 'The given image url is not valid' } },
    { url: 'http://google.com/some/image/path.gif', expected: { error: 'The given image url is not valid' } },
    { url: 'http://google.com/some/image/path.bmp', expected: { error: 'The given image url is not valid' } },
  ];

  testCases.forEach(({ url, expected }) => {
    test(`URL: ${url}`, () => {
      const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass98', 'Aryan', 'Gupta');
      const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
      const result = requestAdminQuizUpdateThumbnail(quiz.quizId, user.token, url);

      expect(result).toStrictEqual(expected);
    });
  });

  test('SUCCESS CASE: Updating the thumbnail once', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass98', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const originalTimeLastEdited = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;

    sleepSync(1000);
    const thumbnailUrl = 'https://aryan.png';
    const result = requestAdminQuizUpdateThumbnail(quiz.quizId, user.token, thumbnailUrl);
    const newTimeLastEdited = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;

    expect(result).toStrictEqual({});
    expect(originalTimeLastEdited).toBeLessThan(newTimeLastEdited);

    expect(requestAdminQuizInfo(user.token, quiz.quizId).thumbnailUrl).toStrictEqual(thumbnailUrl);
  });

  test('SUCCESS CASE: Updating the thumbnail more than once', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass98', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const originalTimeLastEdited = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;

    const thumbnailUrl1 = 'https://aryan.png';
    const thumbnailUrl2 = 'http://nicholas.jpeg';

    sleepSync(1000);
    const result1 = requestAdminQuizUpdateThumbnail(quiz.quizId, user.token, thumbnailUrl1);
    const newTimeLastEdited2 = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;
    expect(requestAdminQuizInfo(user.token, quiz.quizId).thumbnailUrl).toStrictEqual(thumbnailUrl1);

    sleepSync(1000);
    const result2 = requestAdminQuizUpdateThumbnail(quiz.quizId, user.token, thumbnailUrl2);
    const newTimeLastEdited3 = requestAdminQuizInfo(user.token, quiz.quizId).timeLastEdited;
    expect(requestAdminQuizInfo(user.token, quiz.quizId).thumbnailUrl).toStrictEqual(thumbnailUrl2);

    expect(result1).toStrictEqual({});
    expect(result2).toStrictEqual({});
    expect(originalTimeLastEdited).toBeLessThan(newTimeLastEdited2);
    expect(originalTimeLastEdited).toBeLessThan(newTimeLastEdited3);
    expect(newTimeLastEdited2).toBeLessThan(newTimeLastEdited3);
  });
});

// TESTING FOR adminQuizGuestJoin
describe('requestAdminQuizGuestStatus', () => {
  // Error cases
  test('Check if invalid playerId is passed into the function', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    expect(requestAdminQuizGuestStatus(-1)).toStrictEqual({ error: 'Player ID does not exist' });
  });

  test('SUCCESS: Check the status of the player in the LOBBY', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'LOBBY',
      numQuestion: 1,
      atQuestion: 0,
    });
  });

  test('SUCCESS: Check the status of the player at NEXT_QUESTION', () => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');

    expect(requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'NEXT_QUESTION')).toStrictEqual({});
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_COUNTDOWN',
      numQuestion: 1,
      atQuestion: 1,
    });
  });

  test('SUCCESS: Check the status of the player at QUESTION_COUNTDOWN, QUESTION OPEN and QUESTION CLOSE ', async() => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 3 + 2?',
      duration: 5,
      points: 4,
      thumbnailUrl: 'http://example.com/india.jpg',
      answers: [
        { answer: '5', correct: true },
        { answer: '11', correct: false },
        { answer: '0', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');

    // Changing the state from LOBBY to QUESTION_COUNTDOWN
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'NEXT_QUESTION');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_COUNTDOWN',
      numQuestion: 2,
      atQuestion: 1,
    });

    // Changing the state from QUESTION_COUNTDOWN to QUESTION_OPEN
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'SKIP_COUNTDOWN');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_OPEN',
      numQuestion: 2,
      atQuestion: 1,
    });

    sleepSync(questionBody1.duration * 1000);

    // Changing the state from QUESTION_OPEN to QUESTION_CLOSE
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_CLOSE',
      numQuestion: 2,
      atQuestion: 1,
    });

    // Changing the state from QUESTION_CLOSE to QUESTION COUNTDOWN
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'NEXT_QUESTION');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_COUNTDOWN',
      numQuestion: 2,
      atQuestion: 2,
    });

    // Changing the state from QUESTION COUNTDOWN TO END
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'END');
    requestAdminQuizGetQuizStatus(user.token, quiz.quizId, result.sessionId);

    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'END',
      numQuestion: 2,
      atQuestion: 0,
    });
  });

  test('SUCCESS: Check the status of the two player at ANSWER_SHOW, FINAL_RESULTS and END ', async() => {
    const user = requestAdminAuthRegister('Aryan@gmail.com', 'OldPass99', 'Aryan', 'Gupta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const autoStartNum = 5;

    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://example.com/paris.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 3 + 2?',
      duration: 5,
      points: 4,
      thumbnailUrl: 'http://example.com/india.jpg',
      answers: [
        { answer: '5', correct: true },
        { answer: '11', correct: false },
        { answer: '0', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    const result = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);
    const player1 = requestAdminQuizGuestJoin(result.sessionId, 'Aryan');
    const player2 = requestAdminQuizGuestJoin(result.sessionId, 'Jay');

    // Changing the state from LOBBY to QUESTION_COUNTDOWN
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'NEXT_QUESTION');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_COUNTDOWN',
      numQuestion: 2,
      atQuestion: 1,
    });

    expect(requestAdminQuizGuestStatus(player2.playerId)).toStrictEqual({
      state: 'QUESTION_COUNTDOWN',
      numQuestion: 2,
      atQuestion: 1,
    });

    // Changing the state from QUESTION_COUNTDOWN to QUESTION_OPEN
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'SKIP_COUNTDOWN');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_OPEN',
      numQuestion: 2,
      atQuestion: 1,
    });

    expect(requestAdminQuizGuestStatus(player2.playerId)).toStrictEqual({
      state: 'QUESTION_OPEN',
      numQuestion: 2,
      atQuestion: 1,
    });

    sleepSync(questionBody1.duration * 1000);

    // Changing the state from QUESTION_OPEN to QUESTION_CLOSE
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'QUESTION_CLOSE',
      numQuestion: 2,
      atQuestion: 1,
    });

    expect(requestAdminQuizGuestStatus(player2.playerId)).toStrictEqual({
      state: 'QUESTION_CLOSE',
      numQuestion: 2,
      atQuestion: 1,
    });

    // Changing the state from QUESTION_CLOSE to ANSWER_SHOW
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'GO_TO_ANSWER');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'ANSWER_SHOW',
      numQuestion: 2,
      atQuestion: 1,
    });

    expect(requestAdminQuizGuestStatus(player2.playerId)).toStrictEqual({
      state: 'ANSWER_SHOW',
      numQuestion: 2,
      atQuestion: 1,
    });

    // Changing the state from ANSWER_SHOW to FINAL_RESULTS
    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'GO_TO_FINAL_RESULTS');
    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'FINAL_RESULTS',
      numQuestion: 2,
      atQuestion: 0,
    });

    expect(requestAdminQuizGuestStatus(player2.playerId)).toStrictEqual({
      state: 'FINAL_RESULTS',
      numQuestion: 2,
      atQuestion: 0,
    });

    requestAdminQuizUpdateSessionState(quiz.quizId, result.sessionId, user.token, 'END');
    expect(requestAdminQuizGuestStatus(player2.playerId)).toStrictEqual({
      state: 'END',
      numQuestion: 2,
      atQuestion: 0,
    });

    expect(requestAdminQuizGuestStatus(player1.playerId)).toStrictEqual({
      state: 'END',
      numQuestion: 2,
      atQuestion: 0,
    });
  });
});

describe('adminQuizSubmitPlayerAnswers', () => {
  test('Success case: Register multiple player\'s answers, and check', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: {answer: string}) => answer.answer === 'three');
    const answer2 = questionInfo.answers.find((answer: {answer: string}) => answer.answer === 'two');
    const answer3 = questionInfo.answers.find((answer: {answer: string}) => answer.answer === '69');

    // Finally submit the player's response
    const answer1Arr = [answer1.answerId];
    const answer2Arr = [answer2.answerId];
    const answer3Arr = [answer3.answerId];

    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    const player2Response = requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer2Arr);
    const player3Response = requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    expect(player1Response).toStrictEqual({});
    expect(player2Response).toStrictEqual({});
    expect(player3Response).toStrictEqual({});
  });

  test('Success case: Resubmit Answers and check with getQuestionResult function', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer3 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === '69');

    // Finally submit the player's response
    const answer1Arr = [answer1.answerId];
    const answer3Arr = [answer3.answerId];

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer1Arr);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    // RESUBMIT ANSWERS
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer1Arr);

    // change state to answer show to call saniya's function

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');

    const questionResult = requestGetQuestionResults(player1.playerId, 1);

    expect(questionResult.questionId).toEqual(question1.questionId);
    expect(questionResult.playersCorrectList).toEqual(['player1', 'player2', 'player3']);
    expect(questionResult.averageAnswerTime).toStrictEqual(expect.any(Number));
    expect(questionResult.percentCorrect).toStrictEqual(expect.any(Number));
  });

  test('Error cases: Player ID does not exist', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    // create new session
    const autoStartNum = 5;
    requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');

    // Finally submit the player's response
    const answer1Arr = [answer1.answerId];

    // INVALID player ID
    const player1Response = requestAdminQuizSubmitPlayerAnswers(-1, 1, answer1Arr);
    expect(player1Response).toStrictEqual({ error: 'Player ID does not exist' });
  });

  test('Question position is not valid for the session this player is in', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer1Arr = [answer1.answerId];
    // INVALID questionPosition
    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, -1, answer1Arr);
    expect(player1Response).toStrictEqual({ error: 'Question position is not valid for the session this player is in' });
  });

  test('Session is not in QUESTION_OPEN state', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    // DO NOT CHANGE STATUS

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer1Arr = [answer1.answerId];
    // INVALID questionPosition
    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    expect(player1Response).toStrictEqual({ error: 'Session is not in QUESTION_OPEN state' });
  });

  test('Session is not yet up to this question', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'what are you up to?',
      duration: 5,
      points: 3,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'nothing', correct: false },
        { answer: 'nothing much tbh', correct: false },
        { answer: 'DOING COMP1531 PROJECT', correct: true },
      ]
    };
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'what are you up to?');
    const answer2 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'DOING COMP1531 PROJECT');

    // Finally submit the player's response
    const answer2Arr = [answer2.answerId];

    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, 2, answer2Arr);

    expect(player1Response).toStrictEqual({ error: 'Session is not yet up to this question' });
  });

  test('Answer IDs are not valid for this particular question', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    const answer1Arr = [-1];
    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);

    expect(player1Response).toStrictEqual({ error: 'Answer IDs are not valid for this particular question' });
  });

  test('There are duplicate answer IDs provided', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');

    // DUPLICATE the number
    const answer1Arr = [answer1.answerId, answer1.answerId];

    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);

    expect(player1Response).toStrictEqual({ error: 'There are duplicate answer IDs provided' });
  });

  test('Less than 1 answer ID was submitted', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    // Submit NO ANSWERS
    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, []);
    expect(player1Response).toStrictEqual({ error: 'Less than 1 answer ID was submitted' });
  });
});

describe('adminQuizCurrQuestionInfo', () => {
  test('Success case: returns info about current question in session', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const question1 = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    const sessionInfo = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    expect(sessionInfo.state).toStrictEqual('QUESTION_OPEN');

    const result = requestAdminQuizCurrQuestionInfo(player1.playerId, sessionInfo.atQuestion);

    expect(result.questionId).toEqual(question1.questionId);
    expect(result.question).toEqual('Question: What is 1 + 1?');
    expect(result.duration).toEqual(questionBody1.duration);
    expect(result.points).toEqual(questionBody1.points);
    expect(result.answers.length).toEqual(3);
  });

  test('If player ID does not exist', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // DONT CREATE PLAYERs

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    const sessionInfo = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    expect(sessionInfo.state).toStrictEqual('QUESTION_OPEN');

    const result = requestAdminQuizCurrQuestionInfo(-1, sessionInfo.atQuestion);
    expect(result).toStrictEqual({ error: 'Player ID does not exist' });
  });

  test('If question position is not valid for the session this player is in', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    const sessionInfo = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    expect(sessionInfo.state).toStrictEqual('QUESTION_OPEN');

    const result = requestAdminQuizCurrQuestionInfo(player1.playerId, -1);
    expect(result).toStrictEqual({ error: 'Question position is not valid for the session this player is in' });
  });

  test('If session is not currently on this question', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    // change status to OPEN_QUESTION
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // have an expect to check it
    const sessionInfo = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    expect(sessionInfo.state).toStrictEqual('QUESTION_OPEN');

    // NOT AT second question
    const result = requestAdminQuizCurrQuestionInfo(player1.playerId, 2);
    expect(result).toStrictEqual({ error: 'Session is not yet up to this question' });
  });

  test('Session is in LOBBY, QUESTION_COUNTDOWN, or END state', () => {
    // create a user, quiz, question
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ]
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    // create new session
    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    // create a bunch of players
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');

    const sessionInfo = requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId);
    expect(sessionInfo.state).toStrictEqual('LOBBY');
    // CURRLY LOBBY STATE:
    const result = requestAdminQuizCurrQuestionInfo(player1.playerId, sessionInfo.atQuestion);
    expect(result).toStrictEqual({ error: 'Session is in LOBBY, QUESTION_COUNTDOWN, or END state' });
  });
});

// Testing for getQuestionResults
describe('getQuestionResults', () => {
  test('Success case: returns question results', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody1 = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://example.com/image.jpg'
    };

    const questionBody2 = {
      question: 'Question: What is 1111 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://example.com/image.jpg'
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody1);
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody2);

    const autoStartNum = 5;
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, autoStartNum);

    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    expect(requestAdminQuizGetQuizStatus(user.token, quiz.quizId, newSession.sessionId).state).toStrictEqual('QUESTION_OPEN');

    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer2 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'two');
    const answer3 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === '69');

    const answer1Arr = [answer1.answerId];
    const answer2Arr = [answer2.answerId];
    const answer3Arr = [answer3.answerId];

    const player1Response = requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    const player2Response = requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer2Arr);
    const player3Response = requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    expect(player1Response).toStrictEqual({});
    expect(player2Response).toStrictEqual({});
    expect(player3Response).toStrictEqual({});

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');

    const result = requestGetQuestionResults(player1.playerId, 1);

    expect(result).toStrictEqual({
      questionId: questionInfo.questionId,
      playersCorrectList: ['player1'],
      averageAnswerTime: 0,
      percentCorrect: 33
    });
  });

  test('Checks if player ID exists', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');
    const questionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 10,
      answers: [
        { answerId: 1, answer: '4', colour: 'red', correct: true },
        { answerId: 2, answer: '3', colour: 'blue', correct: false }
      ],
      thumbnailUrl: 'http://example.com/question.png'
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 2);

    const player1 = requestAdminQuizGuestJoin(session.sessionId, 'Hayden');
    const player2 = requestAdminQuizGuestJoin(session.sessionId, 'James');

    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);

    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'GET_TO_ANSWER');

    const result = requestGetQuestionResults(-1, 1);
    expect(result).toStrictEqual({ error: 'Player ID does not exist' });
  });

  test('Checks if question position is valid', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');
    const questionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 10,
      answers: [
        { answerId: 1, answer: '4', colour: 'red', correct: true },
        { answerId: 2, answer: '3', colour: 'blue', correct: false }
      ],
      thumbnailUrl: 'http://example.com/question.png'
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 2);

    const player1 = requestAdminQuizGuestJoin(session.sessionId, 'Hayden');
    const player2 = requestAdminQuizGuestJoin(session.sessionId, 'James');

    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);

    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'GET_TO_ANSWER');

    const result = requestGetQuestionResults(player1.playerId, -1);
    expect(result).toStrictEqual({ error: 'Question position is not valid for the session this player is in' });
  });

  test('Checks if session is in ANSWER_SHOW state', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');
    const questionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 10,
      answers: [
        { answerId: 1, answer: '4', colour: 'red', correct: true },
        { answerId: 2, answer: '3', colour: 'blue', correct: false }
      ],
      thumbnailUrl: 'http://example.com/question.png'
    };

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 2);

    const player1 = requestAdminQuizGuestJoin(session.sessionId, 'Hayden');
    const player2 = requestAdminQuizGuestJoin(session.sessionId, 'James');

    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, session.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);

    const result = requestGetQuestionResults(player1.playerId, 1);
    expect(result).toStrictEqual({ error: 'Session is not in ANSWER_SHOW state' });
  });
});

describe('getChatMessages', () => {
  const questionBody = {
    question: 'Question: What is 1 + 1?',
    duration: 4,
    points: 2,
    thumbnailUrl: 'http://example.com/paris.jpg',
    answers: [
      { answer: 'three', correct: true },
      { answer: 'two', correct: false },
      { answer: '69', correct: false },
    ]
  };

  const messageBody = {
    message: 'Message 1'
  };

  test('Is Message was sent successfully and Shown correctly', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player = requestAdminQuizGuestJoin(session.sessionId, 'James');

    const result = requestSendMsgInSession(player.playerId, messageBody);

    const messages = requestGetChatMessages(player.playerId);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Message 1');

    expect(result).toStrictEqual({});
  });

  test('Return all the messages in the correct order', async () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player = requestAdminQuizGuestJoin(session.sessionId, 'James');

    jest.useFakeTimers();
    setTimeout(() => {
      const messageBody1 = {
        message: 'Message 1'
      };

      const messageBody2 = {
        message: 'Message 2'
      };

      requestSendMsgInSession(player.playerId, messageBody1);
      requestSendMsgInSession(player.playerId, messageBody2);

      const messages = requestGetChatMessages(player.playerId);

      expect(messages).toHaveLength(2);
      expect(messages[0].message).toBe('Message 1');
      expect(messages[1].message).toBe('Message 2');
    }, 1000);
    jest.runAllTimers();
  });
});

describe('sendMsgInSession', () => {
  const questionBody = {
    question: 'Question: What is 1 + 1?',
    duration: 4,
    points: 2,
    thumbnailUrl: 'http://example.com/paris.jpg',
    answers: [
      { answer: 'three', correct: true },
      { answer: 'two', correct: false },
      { answer: '69', correct: false },
    ]
  };

  const messageBody = {
    message: 'Hello, this is a test message!'
  };

  const messageBody2 = {
    message: ''
  };

  const messageBody3 = {
    message: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123'
  };

  test('Is Message was sent successfully', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player = requestAdminQuizGuestJoin(session.sessionId, 'James');

    const result = requestSendMsgInSession(player.playerId, messageBody);
    expect(result).toStrictEqual({});
  });

  test('If Message has 0 characters', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player = requestAdminQuizGuestJoin(session.sessionId, 'James');

    const result = requestSendMsgInSession(player.playerId, messageBody2);
    expect(result).toStrictEqual({ error: 'Message body must be between 1 and 100 characters' });
  });

  test('If Message has more than 100 characters', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player = requestAdminQuizGuestJoin(session.sessionId, 'James');

    const result = requestSendMsgInSession(player.playerId, messageBody3);
    expect(result).toStrictEqual({ error: 'Message body must be between 1 and 100 characters' });
  });

  test('If PlayerId is Invalid', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz.');

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const session = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    requestAdminQuizGuestJoin(session.sessionId, 'James');

    const result = requestSendMsgInSession(-1, messageBody);
    expect(result).toStrictEqual({ error: 'Player ID does not exist' });
  });
});

// Testing for getQuizSessionFinalResultsCSV
describe('getQuizSessionFinalResultsCSV', () => {
  const questionBody = {
    question: 'What is 1 + 1?',
    duration: 4,
    points: 2,
    answers: [
      { answer: 'two', correct: true },
      { answer: 'three', correct: false },
      { answer: 'four', correct: false },
    ],
    thumbnailUrl: 'http://example.com/question.png'
  };

  test('Success case: returns final results', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResultsCSV(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({ url: `http://example.com/v1/admin/quiz/${quiz.quizId}/session/${newSession.sessionId}/results/csv` });
  });

  test('Checks for valid token', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const invalidToken = 'a';
    const result = requestGetQuizSessionFinalResultsCSV(invalidToken, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Checks for valid quizId', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResultsCSV(user.token, -1, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a valid quiz' });
  });

  test('Checks if quizId refers to a quiz that this user owns', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const otherUser = requestAdminAuthRegister('otheremail@gmail.com', 'OtherPass123', 'Other', 'User');
    const quiz = requestAdminQuizCreate(otherUser.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(otherUser.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, otherUser.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.tokenn, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResultsCSV(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  test('Checks if sessionId refers to a valid session within this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');

    const result = requestGetQuizSessionFinalResultsCSV(user.token, quiz.quizId, -1);
    expect(result).toStrictEqual({ error: 'Session ID does not refer to a valid session within this quiz' });
  });

  test('Checks if session is in FINAL_RESULTS state', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');

    const result = requestGetQuizSessionFinalResultsCSV(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'Session is not in FINAL_RESULTS state' });
  });
});

// Testing for getQuizSessionFinalResults
describe('getQuizSessionFinalResults', () => {
  const questionBody = {
    question: 'What is 1 + 1?',
    duration: 4,
    points: 2,
    answers: [
      { answer: 'two', correct: true },
      { answer: 'three', correct: false },
      { answer: 'four', correct: false },
    ],
    thumbnailUrl: 'http://example.com/question.png'
  };

  test('Success case: returns final results', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');
    const questionBody = {
      question: 'Question: What is 1 + 1?',
      duration: 4,
      points: 2,
      answers: [
        { answer: 'three', correct: true },
        { answer: 'two', correct: false },
        { answer: '69', correct: false },
      ],
      thumbnailUrl: 'http://example.com/question.png'
    };

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);

    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'Question: What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer2 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'two');
    const answer3 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === '69');

    const answer1Arr = [answer1.answerId];
    const answer2Arr = [answer2.answerId];
    const answer3Arr = [answer3.answerId];

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer2Arr);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResults(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({
      usersRankedByScore: [
        { name: 'player1', score: 2 },
        { name: 'player2', score: 0 },
        { name: 'player3', score: 0 }
      ],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: ['player1'],
          averageAnswerTime: 0,
          percentCorrect: 33
        }
      ]
    });
  });

  test('Checks for valid token', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const invalidToken = 'a';
    const result = requestGetQuizSessionFinalResults(invalidToken, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Checks for valid quizId', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResults(user.token, -1, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a valid quiz' });
  });

  test('Checks if quizId refers to a quiz that this user owns', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const otherUser = requestAdminAuthRegister('otheremail@gmail.com', 'OtherPass123', 'Other', 'User');
    const quiz = requestAdminQuizCreate(otherUser.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(otherUser.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, otherUser.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.tokenn, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, otherUser.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResults(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'QuizId does not refer to a quiz that this user owns' });
  });

  test('Checks if sessionId refers to a valid session within this quiz', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');

    const result = requestGetQuizSessionFinalResults(user.token, quiz.quizId, -1);
    expect(result).toStrictEqual({ error: 'Session ID does not refer to a valid session within this quiz' });
  });

  test('Checks if session is in FINAL_RESULTS state', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'password123', 'Test', 'User');
    const quiz = requestAdminQuizCreate(user.token, 'Math Quiz', 'A simple math quiz');
    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);
    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);
    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, [1]);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, [2]);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, [3]);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');

    const result = requestGetQuizSessionFinalResults(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({ error: 'Session is not in FINAL_RESULTS state' });
  });
});

describe('getPlayerFinalResults', () => {
  const questionBody = {
    question: 'What is 1 + 1?',
    duration: 4,
    points: 2,
    answers: [
      { answer: 'two', correct: true },
      { answer: 'three', correct: false },
      { answer: 'four', correct: false },
    ],
    thumbnailUrl: 'http://example.com/question.png'
  };

  test('Success case: returns final results', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);

    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'two');
    const answer2 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer3 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'four');

    // Finally submit the player's response
    const answer1Arr = [answer1.answerId];
    const answer2Arr = [answer2.answerId];
    const answer3Arr = [answer3.answerId];

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer2Arr);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResults(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({
      usersRankedByScore: [
        { name: 'player1', score: 2 },
        { name: 'player2', score: 0 },
        { name: 'player3', score: 0 }
      ],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: ['player1'],
          averageAnswerTime: 0,
          percentCorrect: 33
        }
      ]
    });
  });

  test('Player Not Found', () => {
    // Simulate the scenario where a player ID does not exist in the session
    const invalidPlayerId = 'a';
    const result = requestGetPlayerFinalResults(invalidPlayerId);
    expect(result).toStrictEqual({ error: 'Player ID does not exist' });
  });

  test('Session Not in FINAL_RESULTS State', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);

    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'two');
    const answer2 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer3 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'four');

    // Finally submit the player's response
    const answer1Arr = [answer1.answerId];
    const answer2Arr = [answer2.answerId];
    const answer3Arr = [answer3.answerId];

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer2Arr);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    const result = requestGetPlayerFinalResults(player1.playerId);
    expect(result).toStrictEqual({ error: 'Session is not in FINAL RESULTS state' });
  });
});

describe('getPlayerFinalResults', () => {
  const questionBody = {
    question: 'What is 1 + 1?',
    duration: 4,
    points: 2,
    answers: [
      { answer: 'two', correct: true },
      { answer: 'three', correct: false },
      { answer: 'four', correct: false },
    ],
    thumbnailUrl: 'http://example.com/question.png'
  };

  test('Success case: returns final results', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    const question = requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);

    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'two');
    const answer2 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer3 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'four');

    // Finally submit the player's response
    const answer1Arr = [answer1.answerId];
    const answer2Arr = [answer2.answerId];
    const answer3Arr = [answer3.answerId];

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer2Arr);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_ANSWER');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'GO_TO_FINAL_RESULTS');

    const result = requestGetQuizSessionFinalResults(user.token, quiz.quizId, newSession.sessionId);
    expect(result).toStrictEqual({
      usersRankedByScore: [
        { name: 'player1', score: 2 },
        { name: 'player2', score: 0 },
        { name: 'player3', score: 0 }
      ],
      questionResults: [
        {
          questionId: question.questionId,
          playersCorrectList: ['player1'],
          averageAnswerTime: 0,
          percentCorrect: 33
        }
      ]
    });
  });

  test('Player Not Found', () => {
    // Simulate the scenario where a player ID does not exist in the session
    const invalidPlayerId = 'a';
    const result = requestGetPlayerFinalResults(invalidPlayerId);
    expect(result).toStrictEqual({ error: 'Player ID does not exist' });
  });

  test('Session Not in FINAL_RESULTS State', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    const quiz = requestAdminQuizCreate(user.token, 'Quiz1', 'description');

    requestAdminQuizQuestionCreate(user.token, quiz.quizId, questionBody);

    const newSession = requestAdminQuizNewSession(quiz.quizId, user.token, 3);

    const player1 = requestAdminQuizGuestJoin(newSession.sessionId, 'player1');
    const player2 = requestAdminQuizGuestJoin(newSession.sessionId, 'player2');
    const player3 = requestAdminQuizGuestJoin(newSession.sessionId, 'player3');

    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'NEXT_QUESTION');
    requestAdminQuizUpdateSessionState(quiz.quizId, newSession.sessionId, user.token, 'SKIP_COUNTDOWN');

    // Submit answers (only one question so questionPosition = 1):
    const quizInfo = requestAdminQuizInfo(user.token, quiz.quizId);
    const questionInfo = quizInfo.questions.find((question: { question: string }) => question.question === 'What is 1 + 1?');
    const answer1 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'two');
    const answer2 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'three');
    const answer3 = questionInfo.answers.find((answer: { answer: string }) => answer.answer === 'four');

    // Finally submit the player's response
    const answer1Arr = [answer1.answerId];
    const answer2Arr = [answer2.answerId];
    const answer3Arr = [answer3.answerId];

    requestAdminQuizSubmitPlayerAnswers(player1.playerId, 1, answer1Arr);
    requestAdminQuizSubmitPlayerAnswers(player2.playerId, 1, answer2Arr);
    requestAdminQuizSubmitPlayerAnswers(player3.playerId, 1, answer3Arr);

    const result = requestGetPlayerFinalResults(player1.playerId);
    expect(result).toStrictEqual({ error: 'Session is not in FINAL RESULTS state' });
  });
});
