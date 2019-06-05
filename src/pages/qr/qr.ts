import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

@Component({
  selector: 'qr-page',
  template: '<img [src]="url"/>'
})

export class QrPage {

  constructor(public params: NavParams) {
    this.url = params.get("url");
  }

  url: string = "";
}
