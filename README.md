# Melodi!

## How to run app locally 
1. In the `backend` dir, run `npm i` then `npm run dev` to start the backend
2. In a separate terminal, run `ngrok http 3000`. This should give you a forwarding URL (e.g. https://6ddf2c46cd6b.ngrok-free.app)
3. Copy the URL and paste in the appropriate spot in `frontend/constants/theme.ts`
4. In the `frontend` dir, run `npm i` then `npx expo start` to start the frontend

Please keep this file up to date.


## How to deploy to TestFlight
1. If eas-cli isn't installed, run `npm install -g eas-cli`
2. Login `eas login`
3. Run `eas build --profile production` in `frontend` dir. Select ALL platforms 
4. (Android): Download apk from Expo and share!
4. (iOS) Run `eas submit -p ios` to submit to App Store Connect

On App store connect
5. Under Apps > Melodi > TestFlight, add `Melodi v1 testers` (internal) and `Melodi v1 testers (external)` to the new build.
You may need to submit a review of the new build.

