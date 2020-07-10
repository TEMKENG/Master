import * as cors from 'cors';
import * as express from 'express';
import * as bodyparser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyparser.json())

export {app};
