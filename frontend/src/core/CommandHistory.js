// src/core/CommandHistory.js
export class CommandHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
    this.redoStack = []; // Clear redo on new action
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
}

// Example Command: Transform Change
export class TransformCommand {
  constructor(object, oldTransform, newTransform, apiService) {
    this.object = object;
    this.oldTransform = oldTransform;
    this.newTransform = newTransform;
    this.apiService = apiService;
  }

  execute() {
    this.object.position.set(this.newTransform.position.x, this.newTransform.position.y, this.newTransform.position.z);
    this.object.rotation.set(this.newTransform.rotation.x, this.newTransform.rotation.y, this.newTransform.rotation.z);
    this.object.scale.set(this.newTransform.scale.x, this.newTransform.scale.y, this.newTransform.scale.z);
    // Debounced API save would be triggered here via EventBus
  }

  undo() {
    this.object.position.set(this.oldTransform.position.x, this.oldTransform.position.y, this.oldTransform.position.z);
    this.object.rotation.set(this.oldTransform.rotation.x, this.oldTransform.rotation.y, this.oldTransform.rotation.z);
    this.object.scale.set(this.oldTransform.scale.x, this.oldTransform.scale.y, this.oldTransform.scale.z);
  }
}