import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CategoryPickPage } from '../categoryPick/categoryPick';
import { ShoppingPage } from '../shopping/shopping';
import { HighscoresPage } from '../highscores/highscores';
import {  AboutPage } from '../about/about';
import { AdMobFree, AdMobFreeBannerConfig, AdMobFreeInterstitialConfig } from '@ionic-native/admob-free';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public admob: AdMobFree) {

  }

  showBanner() {

        let bannerConfig: AdMobFreeBannerConfig = {
            //isTesting: true, // Remove in production
            autoShow: true,
            id: "ca-app-pub-8192361892134426/3727690356"
        };

        this.admob.banner.config(bannerConfig);

        this.admob.banner.prepare().then(() => {
            // success
        }).catch(e => console.log(e));

  }

  launchInterstitial() {

        let interstitialConfig: AdMobFreeInterstitialConfig = {
            //isTesting: true, // Remove in production
            autoShow: true,
            id: "ca-app-pub-8192361892134426/3727690356"
        };

        this.admob.interstitial.config(interstitialConfig);

        this.admob.interstitial.prepare().then(() => {
            // success
        });

  }

  goToCategoriesPage() {
  //push another page onto the history stack
  //causing the nav controller to animate the new page in
    this.navCtrl.push(CategoryPickPage);
  }

  goToShoppiingPage() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
      this.navCtrl.push(ShoppingPage);
  }

  goToTermsPage() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
      //this.navCtrl.parent.select(3);\
      this.navCtrl.push(AboutPage);
  }

  goToHighscoresPage() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
    this.navCtrl.push(HighscoresPage);
  }

  goToProfilePage() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
    this.navCtrl.parent.select(2);
  }
}
