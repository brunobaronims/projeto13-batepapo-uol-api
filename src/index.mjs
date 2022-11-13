import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import Joi from 'joi';
import { userSchema, messageSchema } from './helpers/validation.mjs';

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

  const nameIsRegistered = await uolDb.collection('users').findOne({ name: data });

  if (nameIsRegistered)
    return res.status(409).send('Nome de usuário já cadastrado');

  uolDb.collection('users').insertOne({
    name: data.name,
    lastStatus: Date.now()
  });
  return res.status(201).send('');
});

app.get('/participants', async (req, res) => {
  const list = await uolDb.collection('users').find().toArray();
  return res.send(list);
})

app.listen(5000);