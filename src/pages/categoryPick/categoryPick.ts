import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { TicketPickPage } from '../ticketPick/ticketPick';
import { AboutPage } from '../about/about';
import { categories } from '../../definitions/categories';
import { NativeStorage } from '@ionic-native/native-storage';

@Component({
  selector: 'category-pick',
  templateUrl: 'categoryPick.html'
})
export class CategoryPickPage {

  constructor(public navCtrl: NavController, private alertController: ToastController, private nativeStorage: NativeStorage) {
    this.nativeStorage.getItem('categories')
      .then((categories) => {
        this.categories = categories;
      }, (error) => {
        console.log(error);
      });
  }

  categories: [categories] = null;

  showError(error: string): void {
    this.alertController.create({
      message: error,
      duration: 3000
    }).present();
  }

  goToTicketPage(category: categories) {
  //push another page onto the history stack
  //causing the nav controller to animate the new page in
    this.navCtrl.push(TicketPickPage, { ticketCategory: category });
  }

  pickIcon(categoryName: string) {
    switch(categoryName) {
      case "Ρούχα - Αξεσουάρ": return "shirt";
      case "Υγεία - Ομορφιά": return "bowtie";
      case "Σουπερμάρκετ": return "cart";
      case "Τεχνολογία": return "laptop";
      case "Διασκέδαση": return "restaurant";
      case "Υπηρεσίες": return "build";
      default: return "pricetag";
    }
  }
}
