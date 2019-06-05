import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { GameState } from '../../definitions/GameState';
import { tickets } from '../../definitions/tickets';
import { HomePage } from '../home/home';

@Component({
  selector: 'endGame',
  templateUrl: 'endGame.html'
})
export class EndGamePage {

  constructor(public navCtrl: NavController, public params: NavParams) {
    this.gameState = params.get("gameState");
    this.gameTicket = params.get("gameTicket");

    this.isWin = this.gameState.won;
    this.isCouponStillAvailable = this.gameState.isCouponStillAvailable;
    if (this.isCouponStillAvailable !== false)
      this.isCouponStillAvailable = true;
  }

  isCouponStillAvailable: boolean = null;
  isWin: boolean = null;
  gameState: GameState = null;
  gameTicket: tickets = null;

  goToHomePage() {
    this.navCtrl.setRoot(HomePage);
  }
}
