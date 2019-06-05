import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Highscore } from '../../definitions/highscore';
import { NativeStorage } from '@ionic-native/native-storage';

@Component({
  selector: 'highscores',
  templateUrl: 'highscores.html'
})
export class HighscoresPage {

  constructor(public navCtrl: NavController, private nativeStorage: NativeStorage) {
    this.setHighscores();
  }

  highscores: Highscore[];

  setHighscores() {
    this.nativeStorage.getItem('highscores')
      .then((highscores) => {
        this.highscores = highscores.sort((a, b) => { return b.points - a.points; });
      }, (error) => {
        console.log(error);
      })
  }
}
