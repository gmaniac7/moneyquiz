import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController, PopoverController } from 'ionic-angular';
import { ClockPage } from '../clock/clock';
import { EndGamePage } from '../endGame/endGame';
import { HomePage } from '../home/home';
import { PeopleChoicePage } from '../peopleChoice/peopleChoice';
import { QuestionsService } from '../../services/QuestionsService';
import { NativeStorage } from '@ionic-native/native-storage';
import { GameState } from '../../definitions/GameState';
import { tickets } from '../../definitions/tickets';
import { fiftyfiftyResp } from '../../definitions/helps';
import { inventory } from '../../definitions/inventory';
import { Question } from '../../definitions/question';

import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/retry';

@Component({
  selector: 'question',
  templateUrl: 'question.html'
})
export class QuestionPage {

  @ViewChild(ClockPage) //inject ClockPage (child component) so the parent component code has access to it
  private clockPage: ClockPage;

  constructor(private nativeStorage: NativeStorage, private http: Http, private loadingCtrl: LoadingController, public navCtrl: NavController,
    public params: NavParams, private quetionsService: QuestionsService, private popoverCtrl: PopoverController, private alertController: ToastController) {
    this.nativeStorage.getItem('user')
      .then((user) => {
        this.user = user;
      }, (error) => {
        console.log(error);
      });

    this.gameState = params.get("gameState");
    this.gameTicket = params.get("gameTicket");
    this.question = params.get("gameQuestion");
    this.inventory = params.get("inventory");
    this.disableFiftyFifty = (this.inventory.fiftyfifty == 0);
    this.disableTimeBoost = (this.inventory.timeboost == 0);
    this.disablePeopleChoice = (this.inventory.peoplechoice == 0);
    this.disableSkip = (this.inventory.skip == 0);

    if (this.gameState == null) {
      this.gameState = new GameState();
      this.gameState.maxPoints = this.gameTicket.points;
    }
    this.gameState.currentQuestion++;

    // this.gameState.currentQuestion++;

    // this.question = quetionsService.getQuestion();
    this.startTime = new Date();
  }

  user: any = {};
  inventory: inventory = null;
  endTime: Date = null;
  startTime: Date = null;
  gameState: GameState = null;
  gameTicket: tickets = null;
  question: Question = null;
  pickedAnswer: number = null;
  answerHasBeenPicked = false;
  answerClasses = ["choice", "choice", "choice", "choice"];
  disableFiftyFifty = false;
  disableTimeBoost = false;
  disablePeopleChoice = false;
  disableSkip = false;

  ionViewDidLoad() {
    this.clockPage.setAnimationEndCallback(() => { this.answerWrong() });
  }

  presentLoading() {
    let loader = this.loadingCtrl.create({
      content: "Παρακαλώ Περιμένετε...",
      duration: 0
    });
    loader.present();

    return loader;
  }

  useFiftyFifty() {
    if (this.answerHasBeenPicked) return;
    this.disableFiftyFifty = true;
    this.nativeStorage.getItem('SQtoken')
      .then((SQtoken) => {
        this.setUserInfo(SQtoken).then((user) => { this.updateInventory(user.inventory) });

        var headers = new Headers();
        headers.append('x-sqtoken', SQtoken);
        var requestOption = new RequestOptions({ headers: headers });

        this.http.get("https://api.moneyquiz.gr/v1/game/help/fiftyfifty/" + this.gameState.sessionID, requestOption)
          .map(res => res.json())
          .toPromise()
          .then((resp: fiftyfiftyResp) => {
            this.question.answers.forEach((x, j) => {
              if (resp.answers.indexOf(x) == -1)
                this.question.answers[j] = "";
            });
          }, (error) => {
            console.log(error);
            this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτή τη βοήθεια.");
          });
      }, (error) => {
        console.log(error);
        this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτή τη βοήθεια.");
      });
  }

  useTimeBoost() {
    if (this.answerHasBeenPicked) return;
    this.disableTimeBoost = true;
    this.nativeStorage.getItem('SQtoken')
      .then((SQtoken) => {
        this.setUserInfo(SQtoken).then((user) => { this.updateInventory(user.inventory) });

        var headers = new Headers();
        headers.append('x-sqtoken', SQtoken);
        var requestOption = new RequestOptions({ headers: headers });

        this.http.get("https://api.moneyquiz.gr/v1/game/help/timeboost/" + this.gameState.sessionID, requestOption)
          .map(res => res.text())
          .toPromise()
          .then(() => {
            this.clockPage.stopClock();
            setTimeout(() => { this.clockPage.startClock(); }, 15000);
          }, (error) => {
            console.log(error);
            this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτή τη βοήθεια.");
          });
      }, (error) => {
        console.log(error);
        this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτή τη βοήθεια.");
      });
  }

  usePeopleChoice() {
    if (this.answerHasBeenPicked) return;
    this.disablePeopleChoice = true;
    this.nativeStorage.getItem('SQtoken')
      .then((SQtoken) => {
        this.setUserInfo(SQtoken).then((user) => { this.updateInventory(user.inventory) });

        var headers = new Headers();
        headers.append('x-sqtoken', SQtoken);
        var requestOption = new RequestOptions({ headers: headers });

        this.http.get("https://api.moneyquiz.gr/v1/game/help/peoplechoice/" + this.gameState.sessionID, requestOption)
          .map(res => res.json())
          .toPromise()
          .then((choices) => {
            this.popoverCtrl.create(PeopleChoicePage, { choices: choices }).present();
          }, (error) => {
            console.log(error);
            this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτήν βοήθεια.");
          });
      }, (error) => {
        console.log(error);
        this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτήν βοήθεια.");
      });
  }

  useSkip() {
    if (this.answerHasBeenPicked) return;
    this.disableSkip = true;
    this.nativeStorage.getItem('SQtoken')
      .then((SQtoken) => {
        this.setUserInfo(SQtoken).then((user) => { this.updateInventory(user.inventory) });

        var headers = new Headers();
        headers.append('x-sqtoken', SQtoken);
        var requestOption = new RequestOptions({ headers: headers });

        this.http.get("https://api.moneyquiz.gr/v1/game/help/skip/" + this.gameState.sessionID, requestOption)
          .map(res => res.text())
          .toPromise()
          .then(() => {
            this.clockPage.stopClock();
            this.answerAndGoToNext("");
          }, (error) => {
            console.log(error);
            this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτήν βοήθεια.");
          });
      }, (error) => {
        console.log(error);
        this.showError("Λυπούμαστε αλλά δεν μπορείτε να χρησιμοποιήσετε αυτήν βοήθεια.");
      });
  }

  updateInventory(inventory: inventory) {
    this.inventory = inventory;
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
              resolve(user);
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

  pickAnswer(pickedAnswer): void {
    if (this.answerHasBeenPicked) return;

    this.endTime = new Date();

    this.answerHasBeenPicked = true;
    this.pickedAnswer = pickedAnswer;
    var pickedAnswerText = this.question.answers[pickedAnswer];
    this.answerClasses[pickedAnswer] += " picked-answer";
    this.clockPage.stopClock();
    // setTimeout(() => {
    //   //this.navCtrl.push(EndGamePage, { gameState: this.gameState, gameTicket: this.gameTicket });
    //   this.showCorrectAnswer()
    // }, 1000);

    this.answerAndGoToNext(pickedAnswerText);
  }

  answerAndGoToNext(pickedAnswerText) {
    this.nativeStorage.getItem('SQtoken')
      .then((SQtoken) => {
        var headers = new Headers();
        headers.append('x-sqtoken', SQtoken);
        var requestOption = new RequestOptions({ headers: headers });

        var nextProm = this.http.post('https://api.moneyquiz.gr/v1/game/next/' + this.gameState.sessionID, { answer: pickedAnswerText }, requestOption)
          .map(res => res.json())
          .retry(3)
          .toPromise();

        Promise.all([nextProm, this.waitOneSecond()])
          .then((resp) => {
            if (typeof resp[0].won != 'undefined') {
               this.gameState.won = resp[0].won;
               if(resp[0].isCouponStillAvailable === false)
                this.gameState.isCouponStillAvailable = false;
               return this.navCtrl.push(EndGamePage, { gameState: this.gameState, gameTicket: this.gameTicket });
            }

            var question = new Question();
            question.text = resp[0].question;
            question.answers = resp[0].answers;
            question.image = resp[0].image;

            this.gameState.currentPoints = resp[0].score;
            this.gameState.won = resp[0].won;

            this.question.correctAnswer = this.question.answers.indexOf(resp[0].lastCorrect);
            this.showCorrectAnswer(question);
          }, (error) => {
            this.navCtrl.setRoot(HomePage);
            this.showError("Can not answer question. Check your internet connection and try again.");
            console.log(error);
          });
      }, (error) => {
        this.navCtrl.setRoot(HomePage);
        this.showError("Can not answer question. Check your internet connection and try again.");
        console.log(error);
      });
  }

  waitOneSecond() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 1000)
    });
  }

  answerWrong() {
    this.answerHasBeenPicked = true;
    this.answerAndGoToNext("");  //we pass empty text to we answer wrong
  }

  showError(error: string): void {
    this.alertController.create({
      message: error,
      duration: 3000
    }).present();
  }

  showCorrectAnswer(nextQuestion): void {
    if (this.question.correctAnswer == this.pickedAnswer) {
      this.answerClasses[this.pickedAnswer] += " correct-answer-over-picked";
      this.gameState.correctQuestions++;

      // if (this.endTime.getTime() - this.startTime.getTime() <= 20000)
      //   this.gameState.currentPoints += 50;
      // else
      //   this.gameState.currentPoints += 40;
    }
    else {
      this.answerClasses[this.pickedAnswer] += " wrong-answer";
      this.answerClasses[this.question.correctAnswer] += " correct-answer-over-default";
      // this.gameState.currentPoints -= 10;
    }

    setTimeout(() => {
      if (this.gameState.currentQuestion >= this.gameState.maxQuestions)
        this.navCtrl.push(EndGamePage, { gameState: this.gameState, gameTicket: this.gameTicket });
      else
        this.navCtrl.push(QuestionPage, { gameState: this.gameState, gameTicket: this.gameTicket, gameQuestion: nextQuestion, inventory: this.inventory });
    }, 2500)
  }

  goToHomePage() {
    //push another page onto the history stack
    //causing the nav controller to animate the new page in
    this.navCtrl.setRoot(HomePage);
  }
}
