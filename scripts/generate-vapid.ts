import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();
console.log("Public:", vapidKeys.publicKey);
console.log("Private:", vapidKeys.privateKey);
console.log("\nAdd to .env.local and Vercel:");
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log("VAPID_EMAIL=mailto:your@email.com");
