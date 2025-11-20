class TodoItemSlot extends HTMLElement {
    connectedCallback() {
        // Add dragover listener
        this.addEventListener('dragover', e => {
            e.preventDefault(); // required to allow drop
            this.dispatchEvent(new CustomEvent('slot-dragged-over', {
                bubbles: true,
                detail: { slot: this }
            }));
        });
    }

    highlight() {
        this.classList.add('highlight');
    }

    unhighlight() {
        this.classList.remove('highlight');
    }
}

customElements.define('todo-item-slot', TodoItemSlot);
