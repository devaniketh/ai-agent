import { db } from './db/index.js';
import { todosTable } from './db/schema.js';
import { ilike, eq } from 'drizzle-orm';
import { log } from 'node:console';
import { GoogleGenerativeAI } from "@google/generative-ai";
import readlinkSync from 'readline-sync';

const genAI = new GoogleGenerativeAI()
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function getAllTodos() {
    return await db.select().from(todosTable);
}

async function createTodo(todo) {
    const [result] = await db.insert(todosTable).values({ todo }).returning({ id: todosTable.id });
    return result.id;
}

async function deleteTodoById(id) {
    await db.delete(todosTable).where(eq(todosTable.id, id));
}

async function searchTodo(search) {
    return await db.select().from(todosTable).where(ilike(todosTable.todo, search));
}

const tools = {
    getAllTodos,
    createTodo,
    deleteTodoById,
    searchTodo,
};

const SYSTEM_PROMPT = `
You are an AI TO-DO List Assistant with START, PLAN, Action, observation, and output states.
Wait for user input and first PLAN using available tools.
After PLANNING, take action with appropriate tools and wait for observation based on Action.
Once you get the observations, return the AI response based on the START prompt and observation.

You can manage tasks by adding, viewing, updating, and deleting them.
You must strictly follow the JSON output format.

Available Tools:
- getAllTodos() : Returns all the Todos from Database.
- createTodo(todo: string) : Creates a new Todo in the Db and returns the ID of created Todo.
- deleteTodoById(id: string) : Deletes the todo by ID in the Db.
- searchTodo(search: string) : Searches for all todos matching the query string using ilike.
`;

const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

while (true) {
    const query = readlinkSync.question('>> ');
    const userMessage = { type: 'user', user: query };
    messages.push({ role: 'user', content: JSON.stringify(userMessage) });

    while (true) {
        const chat = await model.generateContent(messages.map(m => m.content).join('\n'));
        let result = chat.response.text().trim();
        
        // Sanitize response to remove markdown artifacts
        result = result.replace(/^```json\n?|```$/g, '');
        
        messages.push({ role: 'assistant', content: result });
        
        let action;
        try {
            action = JSON.parse(result);
        } catch (error) {
            console.error("Error parsing JSON:", result);
            break;
        }
        
        if (action.type === 'output') {
            console.log(`🚀: ${action.output}`);
            break;
        } else if (action.type === 'action') {
            const fn = tools[action.function];
            if (!fn) throw new Error('Invalid Tool Call');
            const observation = await fn(action.input);
            const observationMessage = { type: 'observation', observation };
            messages.push({ role: 'developer', content: JSON.stringify(observationMessage) });
        }
    }
}
