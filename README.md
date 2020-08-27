# gamanfy hrr web-app.

# Project URL: 
https://app.gamanfy.com 

## Description

Web app aimed to provide companies and users a service for finding quality candidates for their job offers and also allowing non company clients to recommend candidates on their own, receiving a reward for each recommendation once it is hired.

## Pages for all users

- **homepage** - Interface that allows to create company and influencer accounts and to login if already registered.
- **sign up** - As a user I want to sign up on the webpage so that I can make recommendations or publish offers.
- **login** - Interface that allows users to login as a company or as an influencer.
- **logout** - As a user I want to be able to log out from the webpage so that I can make sure no one will access my account.
- **homeStart** - User will have the clues to interact with the app.
- **complete profile** - Interface that allows user to complete its account details.
- **offerdetails** - Interface that allows users to check job offers details.

## Pages for Influencer Users

- **profile** - Interface to check private client information.
- **edit profile picture** - Client can change its profile picture while clicking on the user logo next to log out and user name.
- **job offers** - Interface that provides the influencer with all offers from companies and allows it to recommend and filter them by role, city and sector.
- **recommendations** - Interface that shows the influencer its recommendations and its status.
- **my income** - Interface that shows the influencer its account status, how the punctuation system goes, current recommendations and total money earned.
- **gamanfy academy** - Interface that allows influencers to become a member of the Gamanfy Academy.
- **help** - Interface to ask help by email if necessary.
- **confirm account** - Interface that allows user to confirm its account after email link.


## Pages for Companies

- **publish an offer** - Interface that allows companies to publish offers.
- **recommend a professional** -Interface that allows companies to recommend professionals to Gamanfy Team.
- **profile** - Interface that allows companies to check its private data and also to modify tax data.
- **my job offers** - Interface that allows companies to check their job offers and filter them by role, city and sector.
- **my processes** - Interface that allows companies to check job offer's role, city, on Date, inscribed candidates, in process candidates and hired candidates.
- **candidates details** - Interface that allows companies to check candidates short info, ask for a complete report by email and to check if the candidate has been recommended by a professional or amateur headhunter.
- **candidate report** - Interface that allow companies that have asked for candidate report to download its CV, to ask for videoconference interview and to add the candidate to in Process status.
- **employer branding** - Interface that allows companies to create a microsite.


## Routes for influencer users:


| Method | Route Front | Route Back | Description| Completed routes 
|--------|-------|-------|------------|--------|
| POST | auth/user/signup | /auth/user/signup | Signup route. Sends signup info to server, email to user and creates user in DB.
| POST |/auth/confirmation/:userId/:userToken/:isCompany |/auth/confirmation/:userId/:userToken/:isCompany | Confirmation account route. It verifies the account and checks a JSON token.
| POST | /auth/resend | /auth/resend | Resend token route.
| POST | /auth//user/:userId/:isaCompany/complete-profile | /auth//user/:userId/:isaCompany/complete-profile | Complete profile Route.
| POST | auth/user/login | /auth/user/login | Login route. Sends login form info to the server.
| GET | /auth//user/:userId/dashboard | /auth//user/:userId/dashboard | User Dashboard Route. Checks for a token and displays user info.
| POST | /auth/user/:userId/edit-profile | /auth/user/:userId/edit-profile| Edit Profile Route. Admin route to edit user profile.
| POST | /auth//user/:userId/change-profile-picture | /auth/user/:userId/change-profile-picture | Profile picture change route.
| POST | /auth/user/logout | /auth/user/logout | Logout route.
| GET | /auth//user/getData/:userId | /auth//user/getData/:userId | Get user Data Route. Route that brings all user info from db.
| GET | /recommend/:userId/dashboard | /recommend//:userId/dashboard | User recommendations dashboard.
| POST | /recommend/influencerUser/:idCompany/:idUser/:idOffer | /recommend/influencerUser/:idCompany/:idUser/:idOffer | Influencer user recommendation route.
| POST | /recommend/companyUser/:userId/:offerId/:company | /recommend/companyUser/:userId/:offerId/:company | Company user recommendation route.
| POST | /recommend/user/delete-recommendation/:userId/:recommendationId/:offerId | /recommend/user/delete-recommendation/:userId/:recommendationId/:offerId | Route that allows user to delete recommendations. Not implemented.
| POST | /recommend/user/reject-rec/:recommendationId/:offerId | /recommend/user/reject-rec/:recommendationId/:offerId | User rejecting recommendation route. Allows user to reject recommendations being made by other influencers.
| GET | /offers/dashboard | /offers/dashboard | Offers Dashboard for influencers.


## Routes for companies

| Method | Route Front | Route Back | Description| Completed routes 
|--------|-------|-------|------------|--------|
| POST | /auth-co/company/signup | /auth-co/company/signup | ignup route. Sends signup info to server, email to user and creates user in DB.

## Routes for all users

| Method | Route Front | Route Back | Description| Completed routes 
|--------|-------|-------|------------|--------|
| GET | /offers/offer-details/:offerId | /offers/offer-details/:offerId | Offer details.