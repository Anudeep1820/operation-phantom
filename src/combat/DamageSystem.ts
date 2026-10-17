import { PlayerStats, WeaponStats, KillFeedEntry } from '../types';
import { BotController } from '../ai/BotController';

export interface CombatCallbacks {
  onKillFeed: (entry: KillFeedEntry) => void;
  onPlayerDamaged: (amount: number, currentHealth: number, currentArmor: number) => void;
  onPlayerKilled: () => void;
}

export class DamageSystem {
  public playerStats: PlayerStats;
  private callbacks: CombatCallbacks;

  constructor(callbacks: CombatCallbacks) {
    this.callbacks = callbacks;
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      armor: 100,
      maxArmor: 100,
      isAlive: true,
      kills: 0,
      deaths: 0,
      headshots: 0,
      accuracy: { shotsFired: 0, shotsHit: 0 }
    };
  }

  public resetPlayer(): void {
    this.playerStats.health = 100;
    this.playerStats.armor = 100;
    this.playerStats.isAlive = true;
  }

  public recordShot(): void {
    this.playerStats.accuracy.shotsFired++;
  }

  public processPlayerHit(targetBot: BotController, weapon: WeaponStats, isHeadshot: boolean, isOneShot: boolean = false): { killed: boolean; finalDamage: number } {
    this.playerStats.accuracy.shotsHit++;

    const baseDmg = isOneShot ? 9999 : weapon.damage;
    const result = targetBot.takeDamage(baseDmg, isHeadshot, 'Operative (You)');
    if (result.killed) {
      this.playerStats.kills++;
      if (isHeadshot) this.playerStats.headshots++;

      this.callbacks.onKillFeed({
        id: Math.random().toString(36).substring(2, 9),
        killer: 'OPERATIVE',
        victim: targetBot.name,
        weapon: isOneShot ? 'OVERRIDE' : weapon.name,
        isHeadshot,
        isPlayerKill: true,
        timestamp: Date.now()
      });
    }
    return result;
  }

  public damagePlayer(amount: number, attackerName: string = 'Enemy', isGodMode: boolean = false): void {
    if (!this.playerStats.isAlive || isGodMode) {
      // In God Mode, ensure health and armor remain 100%
      if (isGodMode) {
        this.playerStats.health = 100;
        this.playerStats.armor = 100;
      }
      return;
    }

    let damage = amount;
    if (this.playerStats.armor > 0) {
      const absorbed = Math.min(this.playerStats.armor, damage * 0.5);
      this.playerStats.armor -= absorbed;
      damage -= absorbed * 0.5;
    }

    this.playerStats.health = Math.max(0, this.playerStats.health - damage);
    this.callbacks.onPlayerDamaged(damage, this.playerStats.health, this.playerStats.armor);


    if (this.playerStats.health <= 0) {
      this.playerStats.isAlive = false;
      this.playerStats.deaths++;
      this.callbacks.onPlayerKilled();

      this.callbacks.onKillFeed({
        id: Math.random().toString(36).substring(2, 9),
        killer: attackerName,
        victim: 'OPERATIVE',
        weapon: 'AR-7',
        isHeadshot: false,
        isPlayerKill: false,
        timestamp: Date.now()
      });
    }
  }
}
