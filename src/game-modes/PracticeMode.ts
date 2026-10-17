export interface PracticeModeConfig {
  targetScore: number;
  matchDurationSec: number;
}

export class PracticeMode {
  public alphaScore: number = 0;
  public omegaScore: number = 0;
  public timeRemaining: number = 300;
  public targetScore: number = 15;
  public isMatchActive: boolean = false;
  public isMatchOver: boolean = false;
  public isVictory: boolean = false;

  public playerRespawnTimer: number = 0;
  public isPlayerRespawning: boolean = false;

  private onMatchEnd: (isVictory: boolean) => void;

  constructor(config: PracticeModeConfig, onMatchEnd: (isVictory: boolean) => void) {
    this.targetScore = config.targetScore;
    this.timeRemaining = config.matchDurationSec;
    this.onMatchEnd = onMatchEnd;
  }

  public startMatch(): void {
    this.alphaScore = 0;
    this.omegaScore = 0;
    this.timeRemaining = 300;
    this.isMatchActive = true;
    this.isMatchOver = false;
    this.isVictory = false;
    this.isPlayerRespawning = false;
    this.playerRespawnTimer = 0;
  }

  public registerPlayerKill(): void {
    if (!this.isMatchActive || this.isMatchOver) return;
    this.alphaScore++;
    this.checkEndCondition();
  }

  public registerBotKill(): void {
    if (!this.isMatchActive || this.isMatchOver) return;
    this.omegaScore++;
    this.checkEndCondition();
  }

  public triggerPlayerDeath(): void {
    this.isPlayerRespawning = true;
    this.playerRespawnTimer = 3.0; // 3 second tactical respawn delay
  }

  public update(delta: number, onRespawnReady: () => void): void {
    if (!this.isMatchActive || this.isMatchOver) return;

    // Countdown match timer
    this.timeRemaining -= delta;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isVictory = this.alphaScore >= this.omegaScore;
      this.endMatch();
      return;
    }

    // Player respawn timer
    if (this.isPlayerRespawning) {
      this.playerRespawnTimer -= delta;
      if (this.playerRespawnTimer <= 0) {
        this.isPlayerRespawning = false;
        onRespawnReady();
      }
    }
  }

  private checkEndCondition(): void {
    if (this.alphaScore >= this.targetScore) {
      this.isVictory = true;
      this.endMatch();
    } else if (this.omegaScore >= this.targetScore) {
      this.isVictory = false;
      this.endMatch();
    }
  }

  private endMatch(): void {
    this.isMatchActive = false;
    this.isMatchOver = true;
    this.onMatchEnd(this.isVictory);
  }
}
