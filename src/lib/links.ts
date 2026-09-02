// Outbound links that live outside the deploy flow (deploy.ts owns those).
// Request-an-app goes to the verify repo's issue form (request-an-app.yml) so
// every ask lands in the same pipeline the team already works from.
export const REQUEST_APP_URL =
  "https://github.com/CoreNovaLabs/CoreNovaLaunchVerify/issues/new?template=request-an-app.yml";
