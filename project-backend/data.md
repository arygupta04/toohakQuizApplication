```javascript
let data = {
    users: [
        {
            authUserId: 0,
            nameFirst: "Zeeeeee",
            nameLast: "Veeee",
            email: "ZeeeeeeVeeee@hotpotdot.com",
            password: "abcd123!@#$",
            numSuccessfulLogins: 9,
            numFailedPasswordsSinceLastLogin: 6,
            passwordHistory: [],
            sessions: [],
        }
    ],
    quizzes: [ 
        {
            quizId: 1,
            quizOwner: 0,
            name: "Mitochondria",
            description: "Mitochondria is the powerhouse of the cell.",
            timeCreated: 6888888888,
            timeLastEdited: 6888888888,
            questions: [
                {
                    questionId: 101,
                    question: "How old are you?",
                    duration: 30,
                    points: 10,
                    timeLastEdited: 6888888888,
                    thumbnailUrl: "http://example.com/thumbnail.png",
                    answers: [
                        {
                            answerId: 2384,
                            answer: "Prince Charles",
                            colour: "red",
                            correct: true
                        }
                    ]
                }
            ],
            activeQuizSessions: [{
                sessionId: 123,
                quizOwner: 0, 
                name: "Sample Quiz Session",
                timeCreated: Date.now(), 
                timeLastEdited: Date.now(), 
                description: "A session for quiz on Mitochondria",
                thumbnailUrl: "http://example.com/session_thumbnail.png",
                state: "ACTIVE", 
                questions: [],
                guests: [
                {
                    playerId: 497,
                    playerName: "Saniya",
                }
                ],
                message: [],
                autoStartNum: 0,
                atQuestion: 0,
            }],
            inactiveQuizSessions: [],
            activeSessionIds: [],
            inactiveSessionIds: [],
            thumbnailUrl: "http://example.com/quiz_thumbnail.png"
        }
    ]
}
```