import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { userSchema, messageSchema } from './helpers/validation.mjs';
import dayjs from 'dayjs';

const mongoClient = new MongoClient('mongodb://localhost:27017');
await mongoClient.connect();

const uolDb = mongoClient.db('uol');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/participants', async (req, res) => {
  const data = await req.body;

  try {
    await userSchema.validateAsync(data);
  } catch (e) {
    return res.status(422).send(e.message);
  }

  const nameIsRegistered = await uolDb
    .collection('users')
    .findOne({ name: data });
  if (nameIsRegistered)
    return res.status(409).send('Nome de usuário já cadastrado');

  uolDb
    .collection('users')
    .insertOne({
      name: data.name,
      lastStatus: Date(Date.now())
    });
  return res.status(201).send('');
});

app.get('/participants', async (req, res) => {
  const users = await uolDb.collection('users')
    .find()
    .toArray();
  return res.send(users);
});

app.post('/messages', async (req, res) => {
  const data = await req.body;
  const user = req.headers.user;
  const date = Date(Date.now());

  try {
    await messageSchema.validateAsync(data);
  } catch (e) {
    return res.status(422).send(e.message);
  }

  const userExists = await uolDb
    .collection('users')
    .findOne({ name: user });
  if (!userExists)
    return res.status(409).send('Usuário não existe');

  uolDb
    .collection('messages')
    .insertOne({
      from: user,
      to: data.to,
      text: data.text,
      type: data.type,
      time: dayjs(date).format('HH:mm:ss')
    })

  return res.status(201).send('');
});

app.get('/messages', async (req, res) => {
  const user = req.headers.user;
  const messages = await uolDb.collection('messages').find({
    $or: [
      {
        from: user
      },
      {
        to: user
      }
    ]
  }).toArray();
  if (req.query.limit)
    return res.send(messages.slice(0, req.query.limit));
  return res.send(messages);
});

app.listen(5000);