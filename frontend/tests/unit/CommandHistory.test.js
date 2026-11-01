// frontend/tests/unit/CommandHistory.test.js
import { CommandHistory, TransformCommand } from '../../src/core/CommandHistory.js';

describe('CommandHistory', () => {
  let history;
  let mockObject;
  let mockApiService;

  beforeEach(() => {
    history = new CommandHistory();
    mockObject = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    mockApiService = { patch: jest.fn() };
  });

  it('should execute command and add to undo stack', () => {
    const oldTransform = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
    const newTransform = { position: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
    
    const cmd = new TransformCommand(mockObject, oldTransform, newTransform, mockApiService);
    history.execute(cmd);

    expect(mockObject.position.x).toBe(1);
    expect(mockObject.position.y).toBe(2);
    expect(mockObject.position.z).toBe(3);
  });

  it('should undo last command', () => {
    const oldTransform = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
    const newTransform = { position: { x: 5, y: 5, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
    
    const cmd = new TransformCommand(mockObject, oldTransform, newTransform, mockApiService);
    history.execute(cmd);
    history.undo();

    expect(mockObject.position.x).toBe(0);
    expect(mockObject.position.y).toBe(0);
    expect(mockObject.position.z).toBe(0);
  });

  it('should redo undone command', () => {
    const oldTransform = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
    const newTransform = { position: { x: 10, y: 10, z: 10 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
    
    const cmd = new TransformCommand(mockObject, oldTransform, newTransform, mockApiService);
    history.execute(cmd);
    history.undo();
    history.redo();

    expect(mockObject.position.x).toBe(10);
  });

  it('should limit history to max size', () => {
    history.maxHistory = 5;
    
    for (let i = 0; i < 10; i++) {
      const cmd = new TransformCommand(
        mockObject,
        { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { position: { x: i, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        mockApiService
      );
      history.execute(cmd);
    }

    expect(history.undoStack.length).toBe(5);
  });
});