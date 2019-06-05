export class GameState {
  sessionID: string = "";
  currentPoints: number = 0;
  maxPoints: number = 500;
  currentQuestion: number = 0;
  maxQuestions: number = 15;
  correctQuestions: number = 0;
  won: boolean = false;
  isCouponStillAvailable: boolean = true;
}
