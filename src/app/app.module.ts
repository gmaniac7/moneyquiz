import { NgModule, ErrorHandler } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { AdMobFree } from '@ionic-native/admob-free';
import { MyApp } from './app.component';

import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { TermsPage } from '../pages/terms/terms';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { ShoppingPage } from '../pages/shopping/shopping';
import { CategoryPickPage } from '../pages/categoryPick/categoryPick';
import { TicketPickPage } from '../pages/ticketPick/ticketPick';
import { QuestionPage } from '../pages/question/question';
import { EndGamePage } from '../pages/endGame/endGame';
import { PeopleChoicePage } from '../pages/peopleChoice/peopleChoice';
import { ClockPage } from '../pages/clock/clock';
import { LoginPage } from '../pages/login/login';
import { UserPage } from '../pages/user/user';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicy/PrivacyPolicy';
import { TermsAndConditionsPage } from '../pages/TermsAndConditions/TermsAndConditions';
import { HighscoresPage } from '../pages/highscores/highscores';
import { RegisterPage } from '../pages/register/register';
import { registerEmailOnlyPage } from '../pages/registerEmailOnly/registerEmailOnly';
import { QrPage } from '../pages/qr/qr';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { NativeStorage } from '@ionic-native/native-storage';
import { Facebook } from '@ionic-native/Facebook';
import { InAppPurchase } from '@ionic-native/in-app-purchase';

import { QuestionsService } from '../services/QuestionsService';

@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    ContactPage,
    TermsPage,
    HomePage,
    TabsPage,
    ShoppingPage,
    CategoryPickPage,
    TicketPickPage,
    QuestionPage,
    ClockPage,
    EndGamePage,
    LoginPage,
    UserPage,
    PrivacyPolicyPage,
    TermsAndConditionsPage,
    HighscoresPage,
    RegisterPage,
    registerEmailOnlyPage,
    PeopleChoicePage,
    QrPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp, {
      tabsHideOnSubPages: true,
      backButtonText: 'Πiσω',
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    ContactPage,
    TermsPage,
    HomePage,
    TabsPage,
    ShoppingPage,
    CategoryPickPage,
    TicketPickPage,
    QuestionPage,
    ClockPage,
    EndGamePage,
    LoginPage,
    UserPage,
    PrivacyPolicyPage,
    TermsAndConditionsPage,
    HighscoresPage,
    RegisterPage,
    registerEmailOnlyPage,
    PeopleChoicePage,
    QrPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    QuestionsService,
    NativeStorage,
    AdMobFree,
    Facebook,
    InAppPurchase,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
