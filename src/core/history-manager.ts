// The Cricket Guff Studio — History Manager (Undo / Redo / Ball Editing)

import { InningsState, BallDeliveryEvent } from './types';
import { recalculateInnings } from './state-machine';

export class InningsHistoryManager {
  private initialState: InningsState;
  private deliveries: BallDeliveryEvent[];
  private redoStack: BallDeliveryEvent[];
  private playerNames: Record<string, string>;

  constructor(
    initialState: InningsState,
    playerNames: Record<string, string> = {},
    deliveries?: BallDeliveryEvent[],
    redoStack?: BallDeliveryEvent[]
  ) {
    this.initialState = initialState;
    this.deliveries = deliveries ? [...deliveries] : [...initialState.deliveries];
    this.redoStack = redoStack ? [...redoStack] : [];
    this.playerNames = playerNames;
  }

  public updatePlayerNames(names: Record<string, string>): void {
    this.playerNames = { ...this.playerNames, ...names };
  }

  /**
   * Pushes a new delivery event and recalculates state
   */
  public pushDelivery(event: BallDeliveryEvent): InningsState {
    this.deliveries.push(event);
    this.redoStack = []; // Clear redo stack on new action
    return this.getCurrentState();
  }

  /**
   * Undoes the last delivery
   */
  public undo(): InningsState | null {
    if (this.deliveries.length === 0) return null;
    const popped = this.deliveries.pop();
    if (popped) {
      this.redoStack.push(popped);
    }
    return this.getCurrentState();
  }

  /**
   * Redoes the last undone delivery
   */
  public redo(): InningsState | null {
    if (this.redoStack.length === 0) return null;
    const restored = this.redoStack.pop();
    if (restored) {
      this.deliveries.push(restored);
    }
    return this.getCurrentState();
  }

  /**
   * Edit a specific delivery by index
   */
  public editDelivery(index: number, updatedDelivery: BallDeliveryEvent): InningsState {
    if (index < 0 || index >= this.deliveries.length) {
      throw new Error(`Invalid delivery index: ${index}`);
    }
    this.deliveries[index] = updatedDelivery;
    return this.getCurrentState();
  }

  /**
   * Get all deliveries
   */
  public getDeliveries(): BallDeliveryEvent[] {
    return [...this.deliveries];
  }

  /**
   * Get the current redo stack
   */
  public getRedoStack(): BallDeliveryEvent[] {
    return [...this.redoStack];
  }

  /**
   * Returns whether undo is possible
   */
  public canUndo(): boolean {
    return this.deliveries.length > 0;
  }

  /**
   * Returns whether redo is possible
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Recalculates and returns the latest InningsState
   */
  public getCurrentState(): InningsState {
    return recalculateInnings(this.initialState, this.deliveries, this.playerNames);
  }
}
