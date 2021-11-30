const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const username = request.headers['username'];
  const accountExists = users.some((user) => user.username === username);

  if (!accountExists) {
    return response.status(400).json({ error: "Account not found" });
  }

  return next();
}

function checkExistsTodo(request, response, next) {
  const username = request.headers['username'];
  const user = users.filter((user) => user.username === username)[0];
  const todo = user.todos.filter((todo) => todo.id === request.params.id)[0];

  if (!todo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  return next();
}

function getUser(request) {
  const username = request.headers['username'];
  return users.filter((user) => user.username === username)[0];
}

app.post('/users', (request, response) => {
  const { username, name } = request.body;

  if (!username) {
    return response.status(400).json({ error: "Username is required" });
  }

  if (!name) {
    return response.status(400).json({ error: "Name is required" });
  }

  if (users.some((user) => user.username === username)) {
    return response.status(400).json({ error: "Username is already taken" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json({ ...user });
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const user = getUser(request);
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const user = getUser(request);
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    created_at: new Date(),
    deadline,
    done: false
  };

  user.todos.push(todo);

  users.filter((user) => user.username === user.username)[0].todos = user.todos;

  return response.status(201).json({ ...todo });
});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const user = getUser(request);
  const { title, deadline } = request.body;
  const id = request.params.id;

  const todo = user.todos.filter((todo) => todo.id === id)[0];
  todo.title = title;
  todo.deadline = deadline;

  user.todos.filter((todo) => todo.id === id)[0] = { ...todo };

  return response.status(200).send({ title: todo.title, deadline: todo.deadline, done: todo.done });
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const user = getUser(request);
  const id = request.params.id;
  const todo = user.todos.filter((todo) => todo.id === id)[0];

  todo.done = true;

  user.todos.filter((todo) => todo.id === id)[0] = { ...todo };
  return response.status(200).json({ ...todo, done: todo.done });
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const user = getUser(request);
  const id = request.params.id;

  user.todos = user.todos.filter((todo) => todo.id !== id);

  return response.status(204).json({ ...user.todos });
});

module.exports = app;