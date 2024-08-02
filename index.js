import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { DataTypes, Sequelize } from "sequelize";

dotenv.config();

const app = express();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
  }
);

const Todo = sequelize.define("Todo", {
  todo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isChecked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
});

app.use(express.json());
app.use(cors());

app.get("/test", (req, res) => {
  res.send(`Welcome to Todo`);
});

// Initialize the database and start the server
const initializeDbAndServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Ensure table creation
    app.listen(process.env.PORT, () =>
      console.log(`Server Running at http://localhost:${process.env.PORT}/`)
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// Route handlers
app.get("/todos/", async (request, response) => {
  try {
    const todos = await Todo.findAll();
    response.send({ todos });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const todo = await Todo.findByPk(todoId);
    if (todo) {
      response.send(todo);
    } else {
      response.status(404).send({ error: "Todo not found" });
    }
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

app.post("/todos/", async (request, response) => {
  try {
    const { todo, isChecked } = request.body;
    if (!todo || typeof isChecked !== "boolean") {
      return response.status(400).send({ error: "Invalid input" });
    }
    const newTodo = await Todo.create({ todo, isChecked });
    response.status(201).send(newTodo);
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const { isChecked } = request.body;
    if (typeof isChecked !== "boolean") {
      return response.status(400).send({ error: "Invalid input" });
    }
    const [updated] = await Todo.update(
      { isChecked },
      { where: { id: todoId } }
    );
    if (updated) {
      response.sendStatus(204);
    } else {
      response.status(404).send({ error: "Todo not found" });
    }
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const deleted = await Todo.destroy({ where: { id: todoId } });
    if (deleted) {
      response.sendStatus(204);
    } else {
      response.status(404).send({ error: "Todo not found" });
    }
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});
