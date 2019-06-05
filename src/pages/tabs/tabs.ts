import { Component } from '@angular/core';
import { AlertController, NavController, App } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';

import { AboutPage } from '../about/about';
import { UserPage } from '../user/user';
import { HomePage } from '../home/home';
import { TermsPage } from '../terms/terms';
import { LoginPage } from '../login/login';
import { PrivacyPolicyPage } from '../PrivacyPolicy/PrivacyPolicy';
import { TermsAndConditionsPage } from '../TermsAndConditions/TermsAndConditions';

@Component({
  selector: 'tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = AboutPage;
  tab3Root = UserPage;
  tab4Root = TermsPage;

  constructor(public navCtrl: NavController, private app: App, private nativeStorage: NativeStorage, private alertCtrl: AlertController) {

  }

  ionViewWillEnter() {
    this.shouldShowTermsModal()
      .then((shouldShow) => {
        if (shouldShow)
          this.presentTerms();
      });
  }

  openPrivacyPolicyPage() {
    this.navCtrl.push(PrivacyPolicyPage);
  }

  openTermsAndConditionsPage() {
    this.navCtrl.push(TermsAndConditionsPage);
  }

  shouldShowTermsModal(): Promise<boolean> {
    return this.nativeStorage.getItem('acceptedTerms')
      .then((data) => {
        return false;
      }, (data) => {
        return true;
      });
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

  presentTerms() {
    let alert = this.alertCtrl.create({
      title: 'Όροι & προυποθέσεις',
      message: 'Συμφωνειτε με τους <u>Όρους & προυποθέσεις</u> και την <u>Πολιτική Ασφαλείας</u>?',
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'Όροι & προυποθέσεις',
          handler: () => {
            this.openTermsAndConditionsPage();
          }
        }, {
          text: 'Πολιτική Ασφαλείας',
          handler: () => {
            this.openPrivacyPolicyPage();
          }
        }, {
          text: 'Δεν Συμφωνώ',
          role: 'cancel',
          handler: () => {
            this.doFbLogout();
          }
        },
        {
          text: 'Συμφωνώ',
          handler: () => {
            this.nativeStorage.setItem('acceptedTerms', 'true');
            console.log('Buy clicked');
          }
        }
      ]
    });
    alert.present();
  }
}
