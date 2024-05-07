import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';

import {
  adminQuizCreate, adminQuizRemove, adminQuizInfo, adminQuizDescriptionUpdate, adminQuizList,
  adminQuizNameUpdate, viewQuizInTrash, adminQuizTransfer, adminQuizQuestionCreate,
  adminQuizQuestionUpdate, adminQuizQuestionDelete, restoreQuizFromTrash, emptyTrash,
  adminQuizMoveQuestion, adminQuizDuplicateQuestion, adminQuizNewSession, adminQuizUpdateSessionState,
  adminQuizGetQuizStatus, adminQuizGuestJoin, adminQuizUpdateThumbnail, adminQuizGuestStatus, adminQuizSubmitPlayerAnswers,
  adminQuizCurrQuestionInfo, adminQuizViewSessions, getQuestionResults, getQuizSessionFinalResultsCSV, getQuizSessionFinalResults,
  sendMsgInSession, getChatMessages, getPlayerFinalResults
} from './quiz';

import { adminAuthLogin, adminAuthRegister, adminUserDetails, adminUserDetailsUpdate, adminAuthLogout, adminUserPasswordUpdate } from './auth';
import { getData, setData } from './dataStore';
import { clear } from './other';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

const load = () => {
  if (fs.existsSync('./database.json')) {
    const file = fs.readFileSync('./database.json', { encoding: 'utf8' });
    setData(JSON.parse(file));
  }
};

load();

const save = () => {
  fs.writeFileSync('./database.json', JSON.stringify(getData()));
};

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  const result = adminAuthRegister(email, password, nameFirst, nameLast);

  save();
  res.json(result);
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = adminAuthLogin(email, password);

  save();
  res.json(result);
});

// This route handles DELETE requests to '/v1/admin/quiz/:quizid' endpoint
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { quizid } = req.params;
  const result = adminQuizRemove(parseInt(quizid), token);

  save();
  res.json(result);
});

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const result = adminAuthLogout(token);

  save();
  res.json(result);
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const result = adminUserDetails(token);

  save();
  res.json(result);
});

// This route handles PUT requests to '/v2/admin/user/password' endpoint
app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers.token as string;
  const result = adminUserPasswordUpdate(token, oldPassword, newPassword);

  save();
  res.json(result);
});

// ====================================================================
//  ================= QUIZ FUNCTIONS ARE BELOW THIS LINE ==============
// ====================================================================

// This route handles GET requests for '/v2/admin/quiz/list' endpoint
app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const result = adminQuizList(token);

  save();
  res.json(result);
});

// This route handles GET requests for '/v1/admin/quiz/list' endpoint
app.delete('/v1/clear', (req: Request, res: Response) => {
  const result = clear();
  save();
  res.json(result);
});

// This route handles POST requests for '/v2/admin/quiz/:quizid/transfer' endpoint
app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { userEmail } = req.body;
  const quizId = parseInt(req.params.quizid);

  const result = adminQuizTransfer(token, quizId, userEmail);

  save();
  res.json(result);
});

// This route handles POST requests for '/v2/admin/quiz/:quizid/question' endpoint
app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { questionBody } = req.body;
  const quizId = parseInt(req.params.quizid);

  const result = adminQuizQuestionCreate(token, quizId, questionBody);

  save();
  res.json(result);
});

// ====================================================================
//  ================= AUTH FUNCTIONS ARE BELOW THIS LINE ==============
// ====================================================================

// This route handles PUT requests to '/v2/admin/user/details' endpoint
app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { email, nameFirst, nameLast } = req.body;
  const result = adminUserDetailsUpdate(token, email, nameFirst, nameLast);

  save();
  res.json(result);
});

// This route handles POST requests to '/v1/admin/quiz' endpoint
app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name, description } = req.body;
  const result = adminQuizCreate(token, name, description);

  save();
  res.json(result);
});

// This route handles PUT requests to '/v1/admin/quiz/:quizid/description' endpoint
app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { description } = req.body;
  const quizId = parseInt(req.params.quizid);
  const result = adminQuizDescriptionUpdate(token, quizId, description);

  save();
  res.json(result);
});

app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const name = req.body.name;
  const quizId = parseInt(req.params.quizid);

  const result = adminQuizNameUpdate(token, quizId, name);

  save();
  res.json(result);
});

// This route handles PUT requests to '/v1/admin/quiz/:quizid/question/:questionid' endpoint
app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  // const { token, questionBody } = req.body;
  const token = req.headers.token as string;
  // const token = req.header('token');
  const { questionBody } = req.body;
  const { quizid, questionid } = req.params;

  const result = adminQuizQuestionUpdate(parseInt(quizid), parseInt(questionid), questionBody, token);

  save();
  res.json(result);
});

// This route handles DELETE requests to '/v2/admin/quiz/:quizid/question/:questionid' endpoint
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { quizid, questionid } = req.params;
  const result = adminQuizQuestionDelete(parseInt(quizid), parseInt(questionid), token);

  save();
  res.json(result);
});

// This route handles GET requests to '/v1/admin/quiz/trash' endpoint
app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const result = viewQuizInTrash(token);

  res.json(result);
});

// This route handles DELETE requests to '/v1/admin/quiz/trash/empty' endpoint
app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizIds = JSON.parse(req.query.quizIds as string);
  const result = emptyTrash(token, quizIds);

  res.json(result);
});

app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;

  const result = restoreQuizFromTrash(quizId, token);
  res.json(result);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const newPosition = req.body.newPosition;
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);

  const result = adminQuizMoveQuestion(token, quizid, questionid, newPosition);

  save();
  res.json(result);
});

app.get('/v2/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const token = req.headers.token as string;

  const result = adminQuizInfo(token, quizId);
  save();
  res.json(result);
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);

  const result = adminQuizDuplicateQuestion(token, quizid, questionid);

  save();
  res.json(result);
});

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizid);
  const token = req.headers.token as string;

  const result = adminQuizViewSessions(token, quizid);

  save();
  res.json(result);
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizid = parseInt(req.params.quizid);
  const autoStartNum = req.body.autoStartNum;

  const result = adminQuizNewSession(quizid, token, autoStartNum);

  save();
  res.json(result);
});

// This route handles PUT requests to '/v1/admin/quiz/:quizid/session/:sessionid' endpoint
app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const action = req.body.action;
  const quizid = parseInt(req.params.quizid);
  const sessionid = parseInt(req.params.sessionid);
  const token = req.headers.token as string;

  const result = adminQuizUpdateSessionState(quizid, sessionid, token, action);

  save();
  res.json(result);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const token = req.headers.token as string;

  const result = adminQuizGetQuizStatus(token, quizId, sessionId);

  save();
  res.json(result);
});

// This route handles PUT requests to '/v1/player/join' endpoint
app.post('/v1/player/join', (req: Request, res: Response) => {
  const { sessionId, name } = req.body;
  const result = adminQuizGuestJoin(sessionId, name);

  save();
  res.json(result);
});

// This route handles PUT requests to '/v1/admin/quiz/:quizid/thumbnail' endpoint
app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const imgUrl = req.body.imgUrl;

  const result = adminQuizUpdateThumbnail(quizId, token, imgUrl);

  save();
  res.json(result);
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  console.log('playerId: ', playerId);

  const result = adminQuizGuestStatus(playerId);

  save();
  res.json(result);
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const answerIds = req.body.answerIds;

  const result = adminQuizSubmitPlayerAnswers(playerId, questionPosition, answerIds);

  save();
  res.json(result);
});

app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  const result = adminQuizCurrQuestionInfo(playerId, questionPosition);
  save();
  res.json(result);
});

// This route handles GET requests to '/v1/player/:playerid/question/:questionposition/results' endpoint
app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  const result = getQuestionResults(playerId, questionPosition);
  save();
  res.json(result);
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const { messageBody } = req.body;

  const result = sendMsgInSession(playerId, messageBody);
  save();
  res.json(result);
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const result = getChatMessages(playerId);
  save();
  res.json(result);
});

app.get('/v1/player/:playerid/results', (req, res) => {
  const playerId = parseInt(req.params.playerid);

  const result = getPlayerFinalResults(playerId);
  save();
  res.json(result);
});

// This route handles GET requests to '/v1/admin/quiz/:quizid/session/:sessionid/results/csv' endpoint
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);

  const result = getQuizSessionFinalResultsCSV(token, quizId, sessionId);
  save();
  res.json(result);
});

// This route handles GET requests to '/v1/admin/quiz/:quizid/session/:sessionid/results' endpoint
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);

  const result = getQuizSessionFinalResults(token, quizId, sessionId);
  save();
  res.json(result);
});

// ====================================================================
// =================== WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.json({ error });
});

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
