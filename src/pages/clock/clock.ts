import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'clock',
  templateUrl: 'clock.html'
})
export class ClockPage {

  constructor(public navCtrl: NavController) {

  }

  clockState: string = "running";

  callback: () => any = () => {console.log('callback not set')};

  setAnimationEndCallback (callback: () => any) {
    this.callback = callback;
  }

  toggleClock(): void {
    if (this.clockState == "running")
      this.stopClock();
    else
      this.startClock();
  }

  startClock(): void {
    this.clockState = "running";
  }

  stopClock(): void {
    this.clockState = "paused";
  }
}
