import { db } from './db'
import { todosTable } from './db/schema'
import { ilike, eq } from 'drizzle-orm';
import OpenAI from "openai";

const openai = new OpenAI();

async function getAllTodos() {
    const todos = await db.select().from(todosTable);
    return todos;
}
async function createTodo(todo) {
    await db.insert(todosTable).values({
        todo,
    });

}
async function deleteTodoById(id) {
   await db.delete(todosTable).where(eq(todosTable.id, id))
}

async function searchTodo(search) {
    const todos = await db
    .select()
    .from(todosTable)
    .where(ilike(todosTable.todo, search))
    return todos
}

const SYSTEM_PROMPT= `


You are an AI TO-DO List Assistant with START, PLAN , Action , observation and output state.
Wait for user prompt and first PLAn using available tools.
After PLANNING, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the Ai response based on START prompt and observation.

You can manage tasks by adding , viewing, updating , and deleting them.
You must strictly follow the JSON output format.

Todo Db Schema
id : Int and Primary Key
todo : string
created_at : Date Time
updated_at : Date Time

Available Tools:
- getAllTodos() : Returns all the Todos from Database.
- createTodo(todo: string) : Creates a new Todo in the Db and takes todo as a string.
- deleteTodoById (id : String) : Deleted the todo by ID given in the Db.
- searchTodo(search : striung) : Searches for all todos matching the query string using ilike.

Example : 
START 
{"type": "user": "Add a task to shop perfumes"}
{"type": "plan": "I will use createTodo to create a new TODO in Db"}
{"type": "action","createTodo": "addTask", "input" : {"title":"Shopping Perfumes","description";}}
 
`;