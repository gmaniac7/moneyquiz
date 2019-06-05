import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'people-choice',
  templateUrl: 'peopleChoice.html'
})
export class PeopleChoicePage {

  constructor(public navCtrl: NavController, public params: NavParams) {
    this.choicesObject = params.get("choices");
    this.choices = Object.keys(this.choicesObject);
  }

  choicesObject: any;
  choices: string[];
}
