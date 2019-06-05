import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NavController, ToastController, LoadingController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { LoginPage } from '../login/login';

import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'register',
  templateUrl: 'register.html'
})

export class RegisterPage {
  constructor(private http: Http, private loadingCtrl: LoadingController, public navCtrl: NavController, private alertController: ToastController, private formBuilder: FormBuilder, private nativeStorage: NativeStorage) {

  }

  myForm = this.formBuilder.group({
    firstName: [''],
    email: [''],
    lastName: [''],
    passWord: [''],
    passWordRepeat: [''],
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
    var options = {
      message: (error._body) ? error._body : error,
      showCloseButton: false,
      duration: duration || 3000,
      closeButtonText: 'Ok'
    }

    if(duration == Infinity) {
      options.showCloseButton = true
      delete options.duration
    }

    this.alertController.create(options).present();
  }

  register() {
    if (!this.checkForm()) return;

    var Body = {
      firstName: this.myForm.controls["firstName"].value,
      lastName: this.myForm.controls["lastName"].value,
      username: this.myForm.controls["email"].value,
      password: this.myForm.controls["passWord"].value
    };

    this.http.post("https://api.shopping-quiz.com/v1/register", Body)
      .map(res => res.text())
      .toPromise()
      .then((token) => {
        this.navCtrl.setRoot(LoginPage);
        this.showError('Σας έχει αποσταλεί email για επιβεβαίωση του λογαριασμού σας. (στα εισερχόμενα/ανεπιθύμητα e-mail σας)', Infinity);
      }, (resp) => {
        if(resp.status == 0) this.showError('Δεν υπάρχει σύνδεση στο διαδίκτυο');
        else this.showError(resp);
        console.log(resp);
      });
  }

  checkForm() {
    if (!this.myForm.controls['firstName'].value) {
      this.showError('Το πεδίο "Όνομα" είναι απαραίτητο.');
      return false;
    }

    if (!this.myForm.controls['lastName'].value) {
      this.showError('Το πεδίο "Επίθετο" είναι απαραίτητο.');
      return false;
    }

    if (!this.myForm.controls['email'].value) {
      this.showError('Το πεδίο "Email" είναι απαραίτητο.');
      return false;
    }

    this.myForm.controls['email'].setValue(this.myForm.controls['email'].value.trim());
    if (this.myForm.controls['email'].invalid) {
      this.showError('Το πεδίο "Email" δεν είναι σωστό. Παρακαλώ σιγουρευτείτε οτι το έχετε πληκτρολογήσει σωστά και χωρίς κενά.');
      return false;
    }

    if (!this.myForm.controls['passWord'].value) {
      this.showError('Το πεδίο "Κωδικός" είναι απαραίτητο.');
      return false;
    }

    var lengthRegex = new RegExp("^(?=.{8,})");
    if (!lengthRegex.test(this.myForm.controls['passWord'].value)) {
      this.showError('Ο κωδικός πρέπει να εχει μήκος τουλάχιστον 8 χαρακτήρες.');
      return false;
    }

    if (!this.myForm.controls['passWordRepeat'].value) {
      this.showError('Το πεδίο "Επαλήθευση Κωδικού" είναι απαραίτητο.');
      return false;
    }

    if (this.myForm.controls['passWord'].value != this.myForm.controls['passWordRepeat'].value) {
      this.showError('Οι κωδικοί δεν ταιριάζουν.');
      return false;
    }

    return true;
  }
}
