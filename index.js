import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mysql2 from "mysql2";
import { DataTypes, Sequelize } from "sequelize";

dotenv.config();

const app = express();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: "mysql",
    dialectModule: mysql2,
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

// Route handlers
app.get("/todos/", async (request, response) => {
  try {
    const todos = await Todo.findAll();
    response.send({ todos });
  } catch (error) {
    console.error("Error fetching todos:", error.message);
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
    console.error("Error fetching todo:", error.message);
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
    console.error("Error creating todo:", error.message);
    response.status(500).send({ error: error.message });
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const { todo, isChecked } = request.body;
    if (todo !== undefined && typeof todo !== "string") {
      return response.status(400).send({ error: "Invalid todo text" });
    }
    if (isChecked !== undefined && typeof isChecked !== "boolean") {
      return response.status(400).send({ error: "Invalid isChecked value" });
    }
    const [updated] = await Todo.update(
      { todo, isChecked },
      { where: { id: todoId } }
    );
    if (updated) {
      response.sendStatus(204);
    } else {
      response.status(404).send({ error: "Todo not found" });
    }
  } catch (error) {
    console.error("Error updating todo:", error.message);
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
    console.error("Error deleting todo:", error.message);
    response.status(500).send({ error: error.message });
  }
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).send({ error: err.message });
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
    console.error("DB Error:", error.message);
    process.exit(1);
  }
};

initializeDbAndServer();

export default app;
