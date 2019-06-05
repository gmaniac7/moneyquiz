import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { InAppPurchase } from '@ionic-native/in-app-purchase';

@Component({
  selector: 'shopping',
  templateUrl: 'shopping.html'
})
export class ShoppingPage {

  constructor(public navCtrl: NavController, private iap: InAppPurchase, private alertController: ToastController) {
    this.iap
      .getProducts(['people_choice_0', 'fifty_fifty_0', 'time_boost_0', 'skip_0'])
      .then((products) => {
        // this.showError(JSON.stringify(products));
        console.log(JSON.stringify(products));
        //  [{ productId: 'com.yourapp.prod1', 'title': '...', description: '...', price: '...' }, ...]
      })
      .catch((err) => {
        console.log(JSON.stringify(err));
      });
  }

  buy(id: string): void {
    this.iap
      .buy(id)
      .then((data) => {
        // this.showError(JSON.stringify(data));
        console.log(JSON.stringify(data));
        // {
        //   transactionId: ...
        //   receipt: ...
        //   signature: ...
        // }
        return this.iap.consume(data.productType, data.receipt, data.signature);
      })
      .catch((err) => {
        // this.showError(JSON.stringify(err));
        console.log(JSON.stringify(err));
      });
  }

  showError(error: string): void {
    this.alertController.create({
      message: error,
      duration: 3000
    }).present();
  }
}
