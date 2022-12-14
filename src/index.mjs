import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import { userSchema, messageSchema } from './helpers/validation.mjs';
import dayjs from 'dayjs';
import { stripHtml } from 'string-strip-html';

const mongoClient = new MongoClient('mongodb://localhost:27017');
await mongoClient.connect();

const uolDb = mongoClient.db('uol');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/participants', async (req, res) => {
  const data = await req.body;
  const name = stripHtml(data.name).result;

  try {
    await userSchema.validateAsync(data);
  } catch (e) {
    return res.status(422).send(e.message);
  }

  const nameIsRegistered = await uolDb
    .collection('users')
    .findOne({ name: name });
  if (nameIsRegistered)
    return res.status(409).send('Nome de usuário já cadastrado');

  uolDb
    .collection('users')
    .insertOne({
      name: name,
      lastStatus: Date.now()
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
  const user = stripHtml(req.headers.user).result;
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
      to: stripHtml(data.to).result,
      text: stripHtml(data.text).result,
      type: stripHtml(data.type).result,
      time: dayjs(date).format('HH:mm:ss')
    })

  return res.status(201).send('');
});

app.get('/messages', async (req, res) => {
  const user = req.headers.user;
  const messages = await uolDb
    .collection('messages')
    .find({
      $or: [
        { from: user },
        { to: user },
        { type: 'message' },
        { type: 'status' }
      ]
    }).toArray();
  if (req.query.limit)
    return res.send(messages.slice(0, req.query.limit));
  return res.send(messages);
});

app.delete('/messages/:id', async (req, res) => {
  const user = req.headers.user;
  const messageId = ObjectId(req.params.id);

  const message = await uolDb
    .collection('messages')
    .findOne({ _id: messageId });

  if (!message)
    return res.status(404).send('Mensagem não existe');
  else if (user != message.from)
    return res.status(401).send('Remetente inválido');

  await uolDb
    .collection('messages')
    .deleteOne({ _id: messageId });
  return res.status(200).send('');
});

app.put('/messages/:id', async (req, res) => {
  const data = await req.body;
  const user = stripHtml(req.headers.user).result;
  const messageId = ObjectId(req.params.id);

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

  const message = await uolDb
    .collection('messages')
    .findOne({ _id: messageId });

  if (!message)
    return res.status(404).send('Mensagem não existe');
  else if (user != message.from)
    return res.status(401).send('Remetente inválido');

  await uolDb
    .collection('messages')
    .updateOne(
      { _id: messageId },
      {
        $set: {
          from: user,
          to: stripHtml(data.to).result,
          text: stripHtml(data.text).result,
          type: stripHtml(data.type).result
        }
      }
    )

  return res.status(200).send('');
})

app.post('/status', async (req, res) => {
  const user = req.headers.user;

  const userExists = await uolDb
    .collection('users')
    .findOne({ name: user });
  if (!userExists)
    return res.status(404).send('');

  await uolDb
    .collection('users')
    .updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    )

  return res.status(200).send('');
});

setInterval(async () => {
  const currentTime = Date.now();

  try {
    const inactiveUsers = await uolDb
      .collection('users')
      .find(
        { lastStatus: { $lt: currentTime - 10000 } }
      )
      .toArray();
    inactiveUsers.forEach(user => {
      uolDb
        .collection('users')
        .deleteOne(
          { name: user.name }
        );

      uolDb
        .collection('messages')
        .insertOne(
          {
            from: user.name,
            to: 'Todos',
            text: 'sai da sala...',
            type: 'status',
            time: dayjs(Date(currentTime)).format('HH:mm:ss')
          }
        )
    })
  } catch (e) {
    throw new Error(e);
  }
}, '15000')

app.listen(5000);