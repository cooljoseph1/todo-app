import './todo-item.js';
import './todo-item-slot.js';

class TodoList extends HTMLElement {
    connectedCallback() {
        this.todos = [];
        this.dragState = { draggedItem: null, draggedIndex: null, dropIndex: null };
        this.innerHTML = `
            <div class="add-todo-section">
                <input id="new-todo-input" type="text" placeholder="Add a new todo">
                <button id="add-todo-btn">Add</button>
            </div>
            <div class="todo-item-slots"></div>
        `;
        this.input = this.querySelector('#new-todo-input');
        this.addBtn = this.querySelector('#add-todo-btn');
        this.todoItemSlots = this.querySelector('.todo-item-slots');

        this.setupEventListeners();
        this.loadTodos();
    }

    setupEventListeners() {
        // Add Todo
        const addTodo = () => {
            const text = this.input.value.trim();
            if (!text) return;
            const todo = { id: Date.now().toString(), text, completed: false };
            this.input.value = '';
            this.addTodoItem(todo);
            this.saveTodos();
        };
        this.addBtn.addEventListener('click', addTodo);
        this.input.addEventListener('keypress', e => { if (e.key === 'Enter') addTodo(); });

        // Todo events
        this.addEventListener('todo-toggle', e => {
            const todo = this.todos.find(t => t.id === e.detail.id);
            if (todo) { todo.completed = e.detail.completed; this.saveTodos(); }
        });
        this.addEventListener('todo-delete', e => {
            const idx = this.todos.findIndex(t => t.id === e.detail.id);
            if (idx === -1) return;
            this.todos.splice(idx, 1);
            this.removeTodoSlot(idx);
            this.saveTodos();
        });
        this.addEventListener('todo-edit', e => {
            const todo = this.todos.find(t => t.id === e.detail.id);
            if (todo) { todo.text = e.detail.text; this.saveTodos(); }
        });

        // Drag events
        this.addEventListener('drag-start', e => {
            const draggedId = e.detail.id;
            const draggedItem = Array.from(this.todoItemSlots.children)
                .map(slot => slot.firstElementChild)
                .find(item => item.getAttribute('data-id') === draggedId);

            this.dragState.draggedItem = draggedItem;
            this.dragState.draggedIndex = Array.from(this.todoItemSlots.children)
                .indexOf(draggedItem.parentElement);

            draggedItem.parentElement.classList.add('highlight');
        });

        this.addEventListener('drag-end', () => {
            if (!this.dragState.draggedItem) return;

            this.dragState.draggedItem.parentElement.classList.remove('highlight');

            // Reset drag state
            this.dragState.draggedItem = null;
            this.dragState.draggedIndex = null;
        });

        this.addEventListener('slot-dragged-over', e => {
            const targetSlot = e.detail.slot;
            if (!this.dragState.draggedItem) return;

            const slots = Array.from(this.todoItemSlots.children);
            const items = slots.map(slot => slot.firstElementChild);

            const draggedItem = this.dragState.draggedItem;
            const draggedIndex = items.indexOf(draggedItem);
            const targetIndex = slots.indexOf(targetSlot);

            if (draggedIndex === targetIndex) return;

            draggedItem.parentElement.classList.remove('highlight');
            targetSlot.classList.add('highlight');

            // Remove dragged item from array
            items.splice(draggedIndex, 1);
            // Insert at target index
            items.splice(targetIndex, 0, draggedItem);

            // Update DOM: assign each slot its new item
            slots.forEach((slot, i) => {
                slot.innerHTML = '';
                slot.appendChild(items[i]);
            });

            // Update dragState index
            this.dragState.draggedIndex = targetIndex;

            // Update todos array
            this.todos = items.map(item => ({
                id: item.getAttribute('data-id'),
                text: item.getAttribute('data-text'),
                completed: item.getAttribute('data-completed') === 'true'
            }));

            this.saveTodos();
        });

    }

    addTodoItem(todo) {
        const item = document.createElement('todo-item');
        item.setAttribute('data-id', todo.id);
        item.setAttribute('data-text', todo.text);
        item.setAttribute('data-completed', todo.completed);

        const slot = document.createElement('todo-item-slot');
        slot.appendChild(item);
        this.todoItemSlots.appendChild(slot);

        this.todos.push(todo);
    }

    removeTodoSlot(idx) {
        const item = this.todoItemSlots.children[idx];
        if (item) item.remove();
    }

    async loadTodos() {
        try {
            // Remove all old todos first
            this.todoItemSlots.innerHTML = '';
            this.todos = [];

            const resp = await fetch('/data/todo.json');
            if (resp.ok) {
                const todos = await resp.json();
                todos.forEach(todo => this.addTodoItem(todo));
            }
        } catch (err) { console.error(err); }
    }

    async saveTodos() {
        const todos = Array.from(this.todoItemSlots.children).map(slot => {
            const item = slot.firstElementChild;
            return {
                id: item.getAttribute('data-id'),
                text: item.getAttribute('data-text'),
                completed: item.getAttribute('data-completed') === 'true'
            };
        });

        try {
            await fetch('/data/todo.json', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todos)
            });
        } catch (err) { console.error(err); alert('Failed to save changes'); }
    }
}

customElements.define('todo-list', TodoList);
