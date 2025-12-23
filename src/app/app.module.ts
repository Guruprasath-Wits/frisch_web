import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { GoogleMapsModule } from '@angular/google-maps';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { UserComponent } from './user/user.component';
import { UserdetailsComponent } from './userdetails/userdetails.component';
import { AdminComponent } from './admin/admin.component';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { UserprofileComponent } from './userprofile/userprofile.component';
import { CompanydetailsComponent } from './companydetails/companydetails.component';
import { JobsComponent } from './jobs/jobs.component';
import { UsersettingsComponent } from './usersettings/usersettings.component';
import { UserpaymentsComponent } from './userpayments/userpayments.component';
import { VerifyidentityComponent } from './verifyidentity/verifyidentity.component';
import { ReviewComponent } from './review/review.component';
import { AboutusComponent } from './aboutus/aboutus.component';
import { ResumeComponent } from './resume/resume.component';
import { FooterComponent } from './footer/footer.component';
import { ManagejobsComponent } from './managejobs/managejobs.component';
import { UsersidebarComponent } from './usersidebar/usersidebar.component';
import { JobapplyComponent } from './jobapply/jobapply.component';
import { CompanyapplyComponent } from './companyapply/companyapply.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { DeleteaccountComponent } from './deleteaccount/deleteaccount.component';
import { AdmindashboardComponent } from './admindashboard/admindashboard.component';
import { PostjobComponent } from './postjob/postjob.component';
import { OngoingjobsComponent } from './ongoingjobs/ongoingjobs.component';
import { PendingjobsComponent } from './pendingjobs/pendingjobs.component';
import { CompletedjobsComponent } from './completedjobs/completedjobs.component';
import { CancelledjobsComponent } from './cancelledjobs/cancelledjobs.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { DialogComponent } from './dialog/dialog.component';
import { ContactusComponent } from './contactus/contactus.component';
import { FaqComponent } from './faq/faq.component';
import { OurDeliveryComponent } from './our-delivery/our-delivery.component';
import { FreeTrailComponent } from './free-trail/free-trail.component';
import { JoboneComponent } from './jobone/jobone.component';
import { OurProductsComponent } from './our-products/our-products.component';
import { ProductsDetailsComponent } from './products-details/products-details.component';
import { ShopCardComponent } from './shop-card/shop-card.component';
import { OrderComponent } from './order/order.component';
import { CartComponent } from './cart/cart.component';
import { AuthService } from './auth.service';
import { DashboardSidebarComponent } from './dashboard-sidebar/dashboard-sidebar.component';
import { SubscriptionOrderComponent } from './subscription-order/subscription-order.component';
import { SubscribeOrderDashboardComponent } from './subscribe-order-dashboard/subscribe-order-dashboard.component';
import { VacationPauseComponent } from './vacation-pause/vacation-pause.component';
import { ForgetPassComponent } from './forget-pass/forget-pass.component';
import { SampleOrderComponent } from './sample-order/sample-order.component';
import { MapPointComponent } from './map-point/map-point.component';
import { EditSubscribeComponent } from './edit-subscribe/edit-subscribe.component';
import { PaymentPageComponent } from './payment-page/payment-page.component';
import { NgxStripeModule } from 'ngx-stripe';
import { MyAddressComponent } from './my-address/my-address.component';
import { ManualAddressComponent } from './manual-address/manual-address.component';
import { StripeSuccessComponent } from './stripe-success/stripe-success.component';
import { StripeFailureComponent } from './stripe-failure/stripe-failure.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { StripeSubscriptionSuccessComponent } from './stripe-subscription-success/stripe-subscription-success.component';
import { PayNowComponent } from './pay-now/pay-now.component';
import { UnzerSuccessComponent } from './unzer-success/unzer-success.component';
import { UnzerFailureComponent } from './unzer-failure/unzer-failure.component';
import { EmbeddedPaymentComponent } from './embedded-payment/embedded-payment.component';
import { PaypalSubscriptionSuccessComponent } from './paypal-subscription-success/paypal-subscription-success.component';
import { PaypalSubscriptionFailureComponent } from './paypal-subscription-failure/paypal-subscription-failure.component';

// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    SigninComponent,
    SignupComponent,
    UserComponent,
    UserdetailsComponent,
    AdminComponent,
    NavbarComponent,
    UserDashboardComponent,
    UserprofileComponent,
    CompanydetailsComponent,
    JobsComponent,
    UsersettingsComponent,
    UserpaymentsComponent,
    VerifyidentityComponent,
    ReviewComponent,
    AboutusComponent,
    ResumeComponent,
    FooterComponent,
    ManagejobsComponent,
    UsersidebarComponent,
    JobapplyComponent,
    CompanyapplyComponent,
    ChangepasswordComponent,
    DeleteaccountComponent,
    AdmindashboardComponent,
    PostjobComponent,
    OngoingjobsComponent,
    PendingjobsComponent,
    CompletedjobsComponent,
    CancelledjobsComponent,
    DialogComponent,
    ContactusComponent,
    FaqComponent,
    OurDeliveryComponent,
    FreeTrailComponent,
    JoboneComponent,
    OurProductsComponent,
    ProductsDetailsComponent,
    ShopCardComponent,
    OrderComponent,
    CartComponent,
    DashboardSidebarComponent,
    SubscriptionOrderComponent,
    SubscribeOrderDashboardComponent,
    VacationPauseComponent,
    ForgetPassComponent,
    SampleOrderComponent,
    MapPointComponent,
    EditSubscribeComponent,
    PaymentPageComponent,
    MyAddressComponent,
    ManualAddressComponent,
    StripeSuccessComponent,
    StripeFailureComponent,
    ImpressumComponent,
    StripeSubscriptionSuccessComponent,
    PayNowComponent,
    UnzerSuccessComponent,
    UnzerFailureComponent,
    EmbeddedPaymentComponent,
    PaypalSubscriptionSuccessComponent,
    PaypalSubscriptionFailureComponent

  ],
  imports: [
    BrowserModule,
    MatDialogModule, MatExpansionModule,
    RouterModule.forRoot([
      { path: 'guestlogin', component: SigninComponent },
      { path: 'auth', component: SignupComponent },
      { path: '', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'userdetails', component: UserdetailsComponent },
      { path: 'admin', component: AdminComponent },
      { path: 'signin', component: SigninComponent },
      { path: 'userdashboard', component: UserDashboardComponent },
      { path: 'footer', component: FooterComponent },
      { path: 'jobsearch', component: JobsComponent },
      { path: 'manageOrders', component: ManagejobsComponent },
      { path: 'usersidebar', component: UsersidebarComponent },
      { path: 'verifyidentity', component: VerifyidentityComponent },
      { path: 'userprofile', component: UserprofileComponent },
      { path: 'jobapply', component: JobapplyComponent },
      { path: 'companyapply', component: CompanyapplyComponent },
      { path: 'changepassword', component: ChangepasswordComponent },
      { path: 'forgetPass', component: ForgetPassComponent },
      { path: 'pay-now', component: PayNowComponent },
      // { path: 'payment', component: PaymentGat },


      { path: 'deleteaccount', component: DeleteaccountComponent },
      { path: 'admindashboard', component: AdmindashboardComponent },
      { path: 'postjob', component: PostjobComponent },
      { path: 'pendingjobs', component: PendingjobsComponent },
      { path: 'cancelledjobs', component: CancelledjobsComponent },
      { path: 'completedjobs', component: CompletedjobsComponent },
      { path: 'ongoingjobs', component: OngoingjobsComponent },

      { path: 'contact', component: ContactusComponent },
      { path: 'faq', component: FaqComponent },
      { path: 'ourDelivery', component: OurDeliveryComponent },
      { path: 'free-trail', component: FreeTrailComponent },
      { path: 'jobs', component: JoboneComponent },
      { path: 'ourProducts', component: OurProductsComponent },
      { path: 'ourProducts/:categoryId', component: OurProductsComponent },
      { path: 'productDetails/:id', component: ProductsDetailsComponent },
      { path: 'cart', component: CartComponent },
      { path: 'orders', component: OrderComponent },
      { path: 'sample-order/:id', component: SampleOrderComponent },
      { path: 'subscribe-order', component: SubscriptionOrderComponent },
      { path: 'subscribe-order-dashboard', component: SubscribeOrderDashboardComponent },
      { path: 'edit-subscribe', component: EditSubscribeComponent },
      { path: 'vacation-pause', component: VacationPauseComponent },
      { path: 'map-point', component: MapPointComponent },
      { path: 'my-address', component: MyAddressComponent },
      { path: 'manual-address', component: ManualAddressComponent },
      { path: 'stripe-success', component: StripeSuccessComponent },
      { path: 'stripe-failure', component: StripeFailureComponent },
      { path: 'impressum', component: ImpressumComponent},
      { path: 'stripe-Subscription-success', component: StripeSubscriptionSuccessComponent},
      { path: 'unzer-success', component: UnzerSuccessComponent },
      { path: 'unzer-failure', component: UnzerFailureComponent },
{ path: 'embedded-payment', component: EmbeddedPaymentComponent },
 { path: 'paypal-subscription-success', component: PaypalSubscriptionSuccessComponent },
  { path: 'paypal-subscription-failure', component: PaypalSubscriptionFailureComponent },
      



    ],
    {
  scrollPositionRestoration: 'enabled', // ✅ scrolls to top
  anchorScrolling: 'enabled'            // optional: supports #anchor links
}
  ), ReactiveFormsModule, HttpClientModule, FormsModule,
    NgxStripeModule.forRoot("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"),

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private authService: AuthService) {
    authService.checkLoginStatus();
  }
}