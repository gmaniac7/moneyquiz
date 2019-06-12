import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, LoadingController, AlertController } from 'ionic-angular';
import { QuestionPage } from '../question/question';
import { TabsPage } from '../tabs/tabs';
import { NativeStorage } from '@ionic-native/native-storage';
import { tickets } from '../../definitions/tickets';
import { categories } from '../../definitions/categories';
import { GameState } from '../../definitions/GameState';
import { Question } from '../../definitions/question';
import { TicketService } from '../../services/ticket-service';

import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/retry';

@Component({
  selector: 'ticket-pick',
  templateUrl: 'ticketPick.html'
})
export class TicketPickPage {

  constructor(private alertCtrl: AlertController, public ticketService: TicketService, private loadingCtrl: LoadingController, private http: Http, public navCtrl: NavController, private alertController: ToastController, public params: NavParams, private nativeStorage: NativeStorage) {
    var ticketCategory: categories = params.get("ticketCategory");
    this.tickets = new Array<tickets>();

    //this.nativeStorage.getItem('tickets')
    this.tickets = ticketService.getAll();
    /*  .then((tickets) => {
        this.tickets = tickets.filter((item) => {
          return item.category_id == ticketCategory._id;
        });
      }, (error) => {
        console.log(error);
      });*/
  }
  tickets: tickets[] = [];
  rootPage = QuestionPage;
  goToQuestionPage(ticket: tickets) {
    var loader = this.presentLoading();

    this.startGame(ticket)
      .then((startGameObj) => {
        loader.dismiss();
        //push another page onto the history stack
        //causing the nav controller to animate the new page in
        this.navCtrl.push(QuestionPage, { gameTicket: ticket, gameState: startGameObj.gameState, gameQuestion: startGameObj.question, inventory: startGameObj.user.inventory });
      }, (error) => {
        loader.dismiss();
        console.log(error);
      })
  }

  startGame(ticket: tickets): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.nativeStorage.getItem('user')
        .then((user) => {
          this.nativeStorage.getItem('SQtoken')
            .then((SQtoken) => {
              var headers = new Headers();
              headers.append('x-sqtoken', SQtoken);
              var requestOption = new RequestOptions({ headers: headers });

              this.http.get('https://api.moneyquiz.gr/v1/game/start/' + ticket._id, requestOption)
                .map(res => res.text())
                .toPromise()
                .then((sessionID) => {
                  this.http.post('https://api.moneyquiz.gr/v1/game/next/' + sessionID, {}, requestOption)
                    .map(res => res.json())
                    .retry(3)
                    .toPromise()
                    .then((resp) => {
                      var question = new Question();
                      question.text = resp.question;
                      question.answers = resp.answers;
                      question.image = resp.image;

                      var gameState = new GameState();
                      gameState.maxPoints = ticket.points;
                      gameState.sessionID = sessionID;

                      resolve({ question: question, gameState: gameState, user: user });
                    }, (error) => {
                      reject(error);
                      this.navCtrl.setRoot(TabsPage);
                      this.showError("Can not start game. Check your internet connection and try again.");
                      console.log(error);
                    });
                }, (error) => {
                   if (error.status == 406) {
                      let alert = this.alertCtrl.create({
                        title: 'Gor For More',
                        message: 'Έχετε φτάσει το μέγιστο αριθμό δωροεπιταγών (3) που μπορείτε να κερδίσετε. Για να συνεχίσετε να κερδίζετε δωροεπιταγές μπορείτε να προβείτε σε ξεκλείδωμα την υπηρεσίας "Go Fore More" πατώντας παρακάτω.',
                        enableBackdropDismiss: true,
                        buttons: [
                           {
                              text: 'Αγορά (1,50€)',
                              handler: () => {
                                 console.log('buy go for more');
                              }
                           }
                        ]
                     });
                     alert.present();
                  } else if (error.status == 412) {
                     let alert = this.alertCtrl.create({
                       title: 'Αχρησημοποίητο Κουπόνι',
                       message: 'Έχετε ήδη κερδίσει ένα κουπόνι απο την συγκεκριμένη επιχείρηση. Δεν μπορείτε να κερδίσετε δεύτερο πριν χρησιμοποιήσετε το προηγούμενο',
                       enableBackdropDismiss: true,
                       buttons: [
                          {
                             text: 'Εντάξει'
                          }
                       ]
                    });
                    alert.present();
                 }
                 else
                     this.showError("Can not start game. Check your internet connection and try again.");

                  reject(error);
                  this.navCtrl.setRoot(TabsPage);
                  console.log(error);
                });
            }, (error) => {

                this.showError("Can not start game. Check your internet connection and try again.");
              reject(error);
              this.navCtrl.setRoot(TabsPage);
              console.log({error});
            });
        }, (error) => {
          reject(error);
          this.navCtrl.setRoot(TabsPage);
          this.showError("Can not start game. Check your internet connection and try again.");
          console.log(error);
        });
    });
  }

  showError(error: string): void {
    this.alertController.create({
      message: error,
      duration: 3000
    }).present();
  }

  presentLoading() {
    let loader = this.loadingCtrl.create({
      content: "Παρακαλώ Περιμένετε...",
      duration: 0
    });
    loader.present();

    return loader;
  }
}
