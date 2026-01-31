import { v4 as uuidv4 } from 'uuid';

export interface Point {
    x: number;
    y: number;
}

export interface DrawOperation {
    id: string;
    userId: string;
    type: 'stroke';
    points: Point[];
    color: string;
    size: number;
    timestamp: number;
}

export class DrawingState {
    // Global history of operations
    private history: DrawOperation[] = [];
    // Redo stack (cleared on new operation)
    private redoStack: DrawOperation[] = [];
    // Map of active users
    private users: Map<string, { color: string; username: string; x?: number; y?: number }> = new Map();

    constructor() { }

    addUser(userId: string, username: string) {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3', '#F3FF33'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.users.set(userId, { color, username });
        return { color, username };
    }

    removeUser(userId: string) {
        this.users.delete(userId);
    }

    updateCursor(userId: string, x: number, y: number) {
        const user = this.users.get(userId);
        if (user) {
            user.x = x;
            user.y = y;
        }
    }

    addOperation(op: Omit<DrawOperation, 'id' | 'timestamp'>): DrawOperation {
        const operation: DrawOperation = {
            ...op,
            id: uuidv4(),
            timestamp: Date.now()
        };
        this.history.push(operation);
        this.redoStack = [];
        return operation;
    }

    undo(): DrawOperation | null {
        if (this.history.length === 0) return null;
        const op = this.history.pop();
        if (op) {
            this.redoStack.push(op);
            return op;
        }
        return null;
    }

    redo(): DrawOperation | null {
        if (this.redoStack.length === 0) return null;
        const op = this.redoStack.pop();
        if (op) {
            this.history.push(op);
            return op;
        }
        return null;
    }

    getHistory() {
        return this.history;
    }

    getUsers() {
        return Array.from(this.users.entries()).map(([id, data]) => ({ id, ...data }));
    }
}
