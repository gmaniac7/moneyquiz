import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NavController, ToastController, LoadingController, NavParams } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { LoginPage } from '../login/login';

import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'register-email-only',
  templateUrl: 'registerEmailOnly.html'
})

export class registerEmailOnlyPage {
  constructor(private http: Http, private loadingCtrl: LoadingController, public navCtrl: NavController, private alertController: ToastController, private formBuilder: FormBuilder, private nativeStorage: NativeStorage, public params: NavParams) {
    this.fbid = params.get("fbid");
    this.firstName = params.get("firstName");
    this.lastName = params.get("lastName");
  }

  fbid: any;
  firstName: any;
  lastName: any;
  myForm = this.formBuilder.group({
    email: ['']
  });

  presentLoading() {
    let loader = this.loadingCtrl.create({
      content: "Παρακαλώ Περιμένετε...",
      duration: 0
    });
    loader.present();

    return loader;
  }

  showError(error: any, duration?: number): void {
    this.alertController.create({
      message: (error._body) ? error._body : error,
      duration: duration || 3000
    }).present();
  }

  register() {
    if (!this.checkForm()) return;

    var Body = {
      username: this.myForm.controls["email"].value,
      fbid: this.fbid,
      firstName: this.firstName,
      lastName: this.lastName
    };

    this.http.post("https://api.shopping-quiz.com/v1/registeremail", Body)
      .map(res => res.text())
      .toPromise()
      .then((token) => {
        this.navCtrl.setRoot(LoginPage);
        this.showError('Σας έχει αποσταλεί email για επιβεβαίωση του λογαριασμού σας.', 5000);
      }, (resp) => {
        if(resp.status == 0) this.showError('Δεν υπάρχει σύνδεση στο διαδίκτυο');
        else this.showError(resp);
        console.log(resp);
      });
  }

  checkForm() {
    if (!this.myForm.controls['email'].value) {
      this.showError('Το πεδίο "Email" είναι απαραίτητο.');
      return false;
    }

    this.myForm.controls['email'].setValue(this.myForm.controls['email'].value.trim());
    if (this.myForm.controls['email'].invalid) {
      this.showError('Το πεδίο "Email" δεν είναι σωστό. Παρακαλώ σιγουρευτείτε οτι το έχετε πληκτρολογήσει σωστά και χωρίς κενά.');
      return false;
    }

    return true;
  }
}
