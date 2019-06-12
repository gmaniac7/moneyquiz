import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NativeStorage } from '@ionic-native/native-storage';
import { Facebook } from '@ionic-native/Facebook';
import { NavController, ToastController, LoadingController } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { HomePage } from '../home/home';
import { RegisterPage } from '../register/register';
import { registerEmailOnlyPage } from '../registerEmailOnly/registerEmailOnly';

import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  FB_APP_ID: number = 1704758906490554;

  constructor(private loadingCtrl: LoadingController, private formBuilder: FormBuilder, private http: Http, private alertController: ToastController, public navCtrl: NavController, private facebook: Facebook, private nativeStorage: NativeStorage) {
    facebook.browserInit(this.FB_APP_ID, "v2.9");
  }

  myForm = this.formBuilder.group({
    userName: [''],
    passWord: [''],
  });

  showError(error: string): void {
    this.alertController.create({
      message: error,
      duration: 3000
    }).present();
  }

  goToRegisterPage() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
    this.navCtrl.push(RegisterPage);
  }

  skip() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
    this.navCtrl.push(HomePage);
  }

  goToRegisterEmailOnlyPage(fbid: any, firstName: any, lastName: any) {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
    this.navCtrl.push(registerEmailOnlyPage, { fbid: fbid, firstName: firstName, lastName: lastName });
  }

  presentLoading() {
    let loader = this.loadingCtrl.create({
      content: "Παρακαλώ Περιμένετε...",
      duration: 0
    });
    loader.present();

    return loader;
  }

  login(loginType: string) {
    var loader = this.presentLoading();

    this.getToken(loginType)
      .then((token) => {
        var catProm = this.setCategories(token);
        var ticketProm = this.setTickets(token);
        var userProm = this.setUserInfo(token);
        var tokenProm = this.setToken(token);
        var scoresProm = this.setHighscores(token);

        Promise.all([catProm, ticketProm, userProm, tokenProm, scoresProm]).then(() => {
          loader.dismiss();
          this.navCtrl.setRoot(TabsPage);
        }, (error) => {
          loader.dismiss();
          console.log(error);
        });
      }, (error) => {
        loader.dismiss();
        console.log(error);
      })
  }

  getToken(loginType: string) {
    if (loginType == "FB")
      return this.getTokenByFB();
    else
      return this.getTokenBySQ();
  }

  getTokenByFB() {
    //the permissions your facebook app needs from the user
    var permissions = ["public_profile", "email"];

    return new Promise<string>((resolve, reject) => {
      this.facebook.login(permissions)
        .then((response) => {
          this.getTokenUsingFbToken(response.authResponse.accessToken)
            .then((token) => {
              resolve(token);
            } , (error) => {
              if (error.status == 412 && error.json() && error.json().fbid && error.json().firstName && error.json().lastName){
                this.goToRegisterEmailOnlyPage(error.json().fbid, error.json().firstName, error.json().lastName);
                reject(error);
              }
              else {
                reject(error);
                this.showError("Could not login");
                console.log(error);
              }
            });
        }, (error) => {
          reject(error);
          this.showError("Could not login");
          console.log(error);
        });
    });
  }

  getTokenUsingFbToken(FbToken) {
    return new Promise<string>((resolve, reject) => {
      //TODO: take api url from enviroment config
      this.http.get("https://api.moneyquiz.gr/v1/fblogin/" + FbToken)
        .map((res) => {
          return res.text();
        })
        .toPromise()
        .then((token) => {
          resolve(token);
        }, (error) => {
          reject(error);
          console.log(error);
        });
    });
  }

  getTokenBySQ() {
    var loginBody = {
      username: this.myForm.controls["userName"].value.toLowerCase().trim(),
      password: this.myForm.controls["passWord"].value
    };

    return new Promise<string>((resolve, reject) => {
      //TODO: take api url from enviroment config
      this.http.post("https://api.moneyquiz.gr/v1/login", loginBody)
        .map(res => res.text())
        .toPromise()
        .then((token) => {
          resolve(token);
        }, (resp) => {
          if (resp.status == 401) this.showError("Λάθος Κωδικός. Βεβαιωθείτε ότι έχετε επαληθεύσει τον email λογαριασμό σας και ότι τα στοιχεία που έχετε εισάγει είναι σωστά.");
          else if (resp.status == 406) this.showError("Έχετε εγγραφεί με facebook. Παρακαλώ συνδεθείτε με τον αντίστοιχο τρόπο.");
          reject(resp);
          console.log(resp);
        });
    });
  }

  setToken(SQtoken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.nativeStorage.setItem('SQtoken', SQtoken)
        .then(() => {
          resolve();
        }, (error) => {
          reject(error);
          console.log(error);
        });
    });
  }

  setUserInfo(SQtoken: string): Promise<any> {
    return new Promise((resolve, reject) => {

      var headers = new Headers();
      headers.append('x-sqtoken', SQtoken);
      var requestOption = new RequestOptions({ headers: headers });

      //TODO: take api url from enviroment config
      this.http.get("https://api.moneyquiz.gr/v1/data/me", requestOption)
        .map((res) => {
          var user = res.json();
          user.name = ((user.firstName) ? user.firstName : "") + " " + ((user.lastName) ? user.lastName : "");
          return user;
        })
        .toPromise()
        .then((user) => {
          this.nativeStorage.setItem('user', user)
            .then(() => {
              resolve();
            }, (error) => {
              reject(error);
              console.log(error);
            });
        }, (error) => {
          reject(error);
          console.log(error);
        });

    });
  }

  setCategories(SQtoken: string): Promise<any> {
    return new Promise((resolve, reject) => {

      var headers = new Headers();
      headers.append('x-sqtoken', SQtoken);
      var requestOption = new RequestOptions({ headers: headers });

      //TODO: take api url from enviroment config
      this.http.get("https://api.moneyquiz.gr/v1/data/categories", requestOption)
        .map(res => res.json())
        .toPromise()
        .then((categories) => {
          this.nativeStorage.setItem('categories', categories)
            .then(() => {
              resolve();
            }, (error) => {
              reject(error);
              console.log(error);
            });
        }, (error) => {
          reject(error);
          console.log(error);
        });

    });
  }

  setTickets(SQtoken: string): Promise<any> {
    return new Promise((resolve, reject) => {

      var headers = new Headers();
      headers.append('x-sqtoken', SQtoken);
      var requestOption = new RequestOptions({ headers: headers });

      //TODO: take api url from enviroment config
      this.http.get("https://api.moneyquiz.gr/v1/data/coupons", requestOption)
        .map(res => res.json())
        .toPromise()
        .then((tickets) => {
          this.nativeStorage.setItem('tickets', tickets)
            .then(() => {
              resolve();
            }, (error) => {
              reject(error);
              console.log(error);
            });
        }, (error) => {
          reject(error);
          console.log(error);
        });

    });
  }

  setHighscores(SQtoken: string): Promise<any> {
    return new Promise((resolve, reject) => {

      var headers = new Headers();
      headers.append('x-sqtoken', SQtoken);
      var requestOption = new RequestOptions({ headers: headers });

      //TODO: take api url from enviroment config
      this.http.get("https://api.moneyquiz.gr/v1/data/highscores", requestOption)
        .map(res => res.json())
        .toPromise()
        .then((highscores) => {
          this.nativeStorage.setItem('highscores', highscores)
            .then(() => {
              resolve();
            }, (error) => {
              reject(error);
              console.log(error);
            });
        }, (error) => {
          reject(error);
          console.log(error);
        });

    });
  }
}
