import { Component } from '@angular/core';
import { NavController, App, ToastController, PopoverController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { Facebook } from '@ionic-native/Facebook';
import { LoginPage } from '../login/login';
import { QrPage } from '../qr/qr';

@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})

export class UserPage {

  user: any = {};
  inventory: any = {};
  userReady: boolean = false;

  constructor(private popoverCtrl: PopoverController, private alertController: ToastController, private app: App, public navCtrl: NavController, private facebook: Facebook, private nativeStorage: NativeStorage) {

  }

  showQr(ticketCode: string) {
    this.popoverCtrl.create(QrPage, { url: 'https://api.moneyquiz.gr/qr/' + ticketCode + '.svg' }).present();
  }

  showtoken() {
    this.facebook.getAccessToken()
      .then((token) => {
        this.alertController.create({
          message: token,
          duration: 3000
        }).present();
      }, (fa) => {
        this.alertController.create({
          message: "No Token",
          duration: 3000
        }).present();
      });
  }

  ionViewCanEnter() {
    let env = this;
    this.nativeStorage.getItem('user')
      .then((user) => {
        env.user = user;
        env.inventory = user.inventory;
        env.userReady = true;
      }, (error) => {
        console.log(error);
      });
  }

  seeTermsAgain() {
    this.nativeStorage.remove('acceptedTerms');
  }

  doFbLogout() {

		this.nativeStorage.remove('user');
		this.app.getRootNav().setRoot(LoginPage);

		// var nav = this.navCtrl;
    // this.facebook.getLoginStatus().then((response) =>	 {
    //   if (response && response.status === 'connected') {
    //     this.facebook.logout()
    //       .then((response) => {
    //         //user logged out so we will remove him from the NativeStorage
    //         this.nativeStorage.remove('user');
    //         nav.setRoot(LoginPage);
    //       }, (error) => {
    //         console.log(error);
    //       });
    //   }
    // });
  }

  goToHomePage() {
  //push another page onto the history stack
  //causing the nav controller to animate the new page in
    this.navCtrl.parent.select(0);
    // this.navCtrl.setRoot(HomePage);
  }
}
