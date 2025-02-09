import { db } from './db'
import { todosTable } from './db/schema'
import { ilike, eq } from 'drizzle-orm';

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