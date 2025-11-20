class TodoItem extends HTMLElement {
    connectedCallback() {
        const id = this.getAttribute('data-id');
        const text = this.getAttribute('data-text');
        const completed = this.getAttribute('data-completed') === 'true';

        this.innerHTML = `
            <div class="todo-item-container">
                <span class="drag-handle" draggable="true">⋮⋮</span>
                <input type="checkbox" class="todo-checkbox" ${completed ? 'checked' : ''} />
                <span class="todo-text ${completed ? 'completed' : ''}">${this.escapeHtml(text)}</span>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        const checkbox = this.querySelector('.todo-checkbox');
        const deleteBtn = this.querySelector('.delete-btn');
        const textSpan = this.querySelector('.todo-text');

        checkbox.addEventListener('change', () => {
            const completed = checkbox.checked;
            textSpan.classList.toggle('completed', completed);
            this.setAttribute('data-completed', completed);
            this.dispatchEvent(new CustomEvent('todo-toggle', {
                bubbles: true,
                detail: { id: this.getAttribute('data-id'), completed }
            }));
        });

        deleteBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('todo-delete', {
                bubbles: true,
                detail: { id: this.getAttribute('data-id') }
            }));
        });
        
        // Edit when they double click:
        textSpan.addEventListener('dblclick', () => {
            this.startEditing();
        });
    }

    startEditing() {
        const textSpan = this.querySelector('.todo-text');
        const currentText = this.getAttribute('data-text');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'todo-input-edit';
        input.value = currentText;
        
        textSpan.replaceWith(input);
        input.focus();
        input.select();
        
        const finishEditing = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                this.setAttribute('data-text', newText);
                this.dispatchEvent(new CustomEvent('todo-edit', {
                    bubbles: true,
                    detail: { id: this.getAttribute('data-id'), text: newText }
                }));
            }
            
            const completed = this.getAttribute('data-completed') === 'true';
            const newSpan = document.createElement('span');
            newSpan.className = `todo-text ${completed ? 'completed' : ''}`;
            newSpan.textContent = newText || currentText;
            input.replaceWith(newSpan);
            
            newSpan.addEventListener('dblclick', () => {
                this.startEditing();
            });
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                const completed = this.getAttribute('data-completed') === 'true';
                const newSpan = document.createElement('span');
                newSpan.className = `todo-text ${completed ? 'completed' : ''}`;
                newSpan.textContent = currentText;
                input.replaceWith(newSpan);
                
                newSpan.addEventListener('dblclick', () => {
                    this.startEditing();
                });
            }
        });
    }

    setupDragAndDrop() {
        const handle = this.querySelector('.drag-handle');
        handle.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
            this.querySelector('.todo-item-container').classList.add('dragging');

            this.dispatchEvent(new CustomEvent('drag-start', {
                bubbles: true,
                detail: { id: this.getAttribute('data-id') }
            }));
        });

        handle.addEventListener('dragend', () => {
            this.querySelector('.todo-item-container').classList.remove('dragging');
            this.dispatchEvent(new CustomEvent('drag-end', { bubbles: true }));
        });
    }
}

customElements.define('todo-item', TodoItem);
