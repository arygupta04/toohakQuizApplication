import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;

interface Answer {
  answer: string;
  correct: boolean;
}

interface QuestionBody {
  question: string;
  duration: number;
  points: number;
  answers: Answer[];
}

interface MessageBodyHelper {
  message: string
}

export const requestAdminQuizCreate = (token: string, name: string, description: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/v2/admin/quiz',
    {
      headers: { token },
      json: { name, description } // Pass token as string directly
    }
  );

  return JSON.parse(res.body.toString());
};

// Initiates a DELETE request to the quiz remove endpoint
// The function removes a quiz by sending their details to the server
export const requestAdminQuizRemove = (quizid: number, token: string) => {
  const res = request(
    'DELETE',
    SERVER_URL + `/v2/admin/quiz/${quizid}`,
    {
      headers: { token },
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminQuizInfo = (token: string, quizId: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v2/admin/quiz/${quizId}`,
    {
      headers: { token }
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminQuizDescriptionUpdate = (token: string, quizId: number, description: string) => {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizId}/description`,
    {
      headers: { token },
      json: { quizId, description } // Pass token as string directly
    }
  );

  return JSON.parse(res.body.toString());
};

export const requestAdminQuizNameUpdate = (token: string, quizId: number, name: string) => {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizId}/name`,
    {
      headers: { token },
      json: { quizId, name },
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a PUT request to the admin quiz update endpoint
export const requestUpdateQuizQuestion = (quizid: number, questionid: number, token: string, questionBody: QuestionBody): string => {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizid}/question/${questionid}`,
    {
      headers: { token },
      json: {
        questionBody: questionBody
      },
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a DELETE request to the admin quiz delete endpoint
export const requestDeleteQuizQuestion = (quizid: number, questionid: number, token: string): string => {
  const res = request(
    'DELETE',
    SERVER_URL + `/v2/admin/quiz/${quizid}/question/${questionid}`,
    {
      headers: { token },
      timeout: 100
    }
  );
  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for adminQuizList
export const requestAdminQuizList = (token: string) => {
  const res = request(
    'GET',
    SERVER_URL + '/v2/admin/quiz/list',
    {
      headers: { token },
      timeout: 100
    }
  );
  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for viewQuizinTrash
export const requestViewQuizInTrash = (token: string) => {
  const res = request(
    'GET',
    SERVER_URL + '/v2/admin/quiz/trash',
    {
      headers: { token }
    }
  );

  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for restoreQuizFromTrash
export const requestRestoreQuizFromTrash = (quizid: number, token: string) => {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizid}/restore`,
    {
      headers: { token }
    }
  );

  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for adminQuizTransfer
export const requestAdminQuizTransfer = (token: string, quizId: number, userEmail: string) => {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`,
    {
      headers: { token },
      json: { userEmail }
    }
  );

  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for adminQuizQuestionCreate
export const requestAdminQuizQuestionCreate = (token: string, quizId: number, questionBody: QuestionBody) => {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question`,
    {
      headers: { token },
      json: { questionBody }
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminQuizMoveQuestion = (token: string, quizId: number, questionId: number, newPosition: number) => {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}/move`,
    {
      headers: { token },
      json: { quizId, questionId, newPosition },
    }
  );
  return JSON.parse(res.body.toString());
};

// The function empties the trash
// change quizId type from any to something
export const requestEmptyTrash = (token: string, quizIds: string) => {
  const res = request(
    'DELETE',
    SERVER_URL + '/v2/admin/quiz/trash/empty',
    {
      headers: { token },
      qs: { quizIds }
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminQuizDuplicateQuestion = (token: string, quizId: number, questionId: number) => {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}/duplicate`,
    {
      headers: { token },
      json: { quizId, questionId }
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminQuizViewSessions = (token: string, quizid: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizid}/sessions`,
    {
      headers: { token }
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a POST request to the admin quiz new session endpoint
// The function creates a new quiz session by sending their details to the server
export const requestAdminQuizNewSession = (quizid: number, token: string, autoStartNum: number) : {sessionId: number } => {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizid}/session/start`,
    {

      headers: { token },

      json: {
        autoStartNum
      },
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a PUT request to the admin quiz update session state endpoint
// The function updates a quiz session's state by sending their details to the server
export const requestAdminQuizUpdateSessionState = (quizid: number, sessionid: number, token: string, action: string) => {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizid}/session/${sessionid}`,
    {
      headers: { token },
      json: {
        action
      },
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminQuizGetQuizStatus = (token: string, quizid: number, sessionid: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizid}/session/${sessionid}`,
    {
      headers: { token }
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a POST request to the admin quiz new session endpoint
export const requestAdminQuizGuestJoin = (sessionId: number, name: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/v1/player/join',

    {
      json: { sessionId, name } // Pass token as string directly
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a PUT request to the admin quiz update session state endpoint
export const requestAdminQuizUpdateThumbnail = (quizid: number, token: string, imgUrl: string) => {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizid}/thumbnail`,
    {
      headers: { token },
      json: { imgUrl },
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a PUT request to the admin quiz update session state endpoint
export const requestAdminQuizGuestStatus = (playerId: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}`
  );

  return JSON.parse(res.body.toString());
};

export const requestAdminQuizSubmitPlayerAnswers = (playerid: number, questionposition: number, answerIds: number[]) => {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/player/${playerid}/question/${questionposition}/answer`,
    {
      json: { answerIds },
    }
  );

  return JSON.parse(res.body.toString());
};

export const requestAdminQuizCurrQuestionInfo = (playerid: number, questionposition: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerid}/question/${questionposition}`
  );

  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for getQuestionResults
export const requestGetQuestionResults = (playerid: number, questionposition: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerid}/question/${questionposition}/results`
  );

  return JSON.parse(res.body.toString());
};

export const requestSendMsgInSession = (playerid: number, messageBody: MessageBodyHelper) => {
  const res = request(
    'POST',
    SERVER_URL + `/v1/player/${playerid}/chat`,
    {
      json: { messageBody }
    }
  );

  return JSON.parse(res.body.toString());
};

export const requestGetChatMessages = (playerid: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerid}/chat`
  );

  return JSON.parse(res.body.toString());
};

export const requestGetPlayerFinalResults = (playerid: string) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerid}/results`
  );
  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for getQuizSessionFinalResultsCSV
export const requestGetQuizSessionFinalResultsCSV = (token: string, quizid: number, sessionid: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizid}/session/${sessionid}/results/csv`,
    {
      headers: { token }
    }
  );
  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for getQuizSessionFinalResults
export const requestGetQuizSessionFinalResults = (token: string, quizid: number, sessionid: number) => {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizid}/session/${sessionid}/results`,
    {
      headers: { token }
    }
  );
  return JSON.parse(res.body.toString());
};
