import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { NativeStorage } from '@ionic-native/native-storage';

import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';

import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any;

  constructor(private http: Http, platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public nativeStorage: NativeStorage) {
    let $this = this;
    platform.ready().then(() => {
      Promise.all([this.getUser(), this.initCategories(), this.initTickets(), this.initHighscores(), this.initText()])
        .then((data) => {
          var isUserLogedIn = data[0];
          if (isUserLogedIn)
            $this.rootPage = TabsPage;
          else
            $this.rootPage = LoginPage;

          statusBar.styleDefault();
          splashScreen.hide();
        }, (error) => {
          console.log(error);
        });
    }, (error) => {
      console.log(error);
    });
  }

  getUser(): Promise<boolean> {
    // Here we will check if the user is already logged in
    // because we don't want to ask users to log in each time they open the app
    return this.nativeStorage.getItem('user')
      .then(data => {
        // user is previously logged and we have his data
        // we will let him access the app
        return true;
      }, function(error) {
        //we don't have the user data so we will ask him to log in
        return false;
      });
  }

  initCategories(): Promise<any> {
    return this.getCategories().then((categories) => {
      this.nativeStorage.setItem('categories', categories);
    }, (error) => {
      console.log(error);
    });
  }

  getText() {
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
        }, (error) => {
           reject(error);
           console.log(error);
        });
     });
  }

  getCategories(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.nativeStorage.getItem('SQtoken')
        .then((token) => {
          var headers = new Headers();
          headers.append('x-sqtoken', token);
          var requestOption = new RequestOptions({ headers: headers });

          //TODO: take api url from enviroment config
          this.http.get("https://api.moneyquiz.gr/v1/data/categories", requestOption)
            .map(res => res.json())
            .toPromise().then((categories) => {
              resolve(categories);
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

  initText(): Promise<any> {
    return this.getText().then((text) => {
      this.nativeStorage.setItem('text', text);
    }, (error) => {
      console.log(error);
    });
  }

  initTickets(): Promise<any> {
    return this.getTickets().then((tickets) => {
      this.nativeStorage.setItem('tickets', tickets);
    }, (error) => {
      console.log(error);
    });
  }

  getTickets(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.nativeStorage.getItem('SQtoken')
        .then((token) => {
          var headers = new Headers();
          headers.append('x-sqtoken', token);
          var requestOption = new RequestOptions({ headers: headers });

          //TODO: take api url from enviroment config
          this.http.get("https://api.moneyquiz.gr/v1/data/coupons", requestOption)
            .map(res => res.json())
            .toPromise().then((tickets) => {
              resolve(tickets);
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

  initHighscores(): Promise<any> {
    return this.getHighscores().then((highscores) => {
      this.nativeStorage.setItem('highscores', highscores);
    }, (error) => {
      console.log(error);
    });
  }

  getHighscores(): Promise<any> {
    return new Promise((resolve, reject) => {

      this.nativeStorage.getItem('SQtoken')
        .then((token) => {
          var headers = new Headers();
          headers.append('x-sqtoken', token);
          var requestOption = new RequestOptions({ headers: headers });

          //TODO: take api url from enviroment config
          this.http.get("https://api.moneyquiz.gr/v1/data/highscores", requestOption)
            .map(res => res.json())
            .toPromise()
            .then((highscores) => {
              resolve(highscores);
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
