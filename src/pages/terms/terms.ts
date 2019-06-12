import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { HomePage } from '../home/home';
import { Http, Headers, RequestOptions } from '@angular/http';

@Component({
  selector: 'terms',
  templateUrl: 'terms.html'
})
export class TermsPage {

  text: any;
  error: any;

  constructor(private http: Http, public navCtrl: NavController, private nativeStorage: NativeStorage) {
    try {
      this.nativeStorage.getItem('text')
        .then((text) => {
          this.text = text;
          if(!text)
            this.getTextNow().then((text: any) => this.forceShowText(text.rulesText.value));
          else
            this.forceShowText(text.rulesText.value);
        }, (error) => {
          console.log(error);
          this.getTextNow().then((text: any) => this.forceShowText(text.rulesText.value));
          this.error = error;
        });
    } catch (e) { this.error = e }
  }

  forceShowText(text) {
    setTimeout(() => {
      window['document']['getElementById']('rulesText')['innerHTML'] = text;
    }, 500);
  }

  getTextNow() {
    return new Promise((resolve, reject) => {
      this.nativeStorage.getItem('SQtoken')
        .then((token) => {
          var headers = new Headers();
          headers.append('x-sqtoken', token);
          var requestOption = new RequestOptions({ headers: headers });
          this.http.get("https://api.moneyquiz.gr/v1/data/text", requestOption)
            .map(res => res.json())
            .toPromise().then((text) => {
              resolve(text);
            }, (error) => {
              reject(error);
              console.log(error);
            });
        });
    });
  }

  goToHomePage() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
    this.navCtrl.parent.select(0);
    // this.navCtrl.setRoot(HomePage);
  }
}
