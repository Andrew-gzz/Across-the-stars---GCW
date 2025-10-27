let userAccessToken = null;
let userID = null;

// Wait for SDK to initialize (your facebook.js must call FB.init)
window.fbAsyncInit = function () {
    FB.init({
        appId: '2062336774513098',
        cookie: true,
        xfbml: true,
        version: 'v24.0'
    });

    FB.getLoginStatus(function (response) {
        if (response.status === 'connected') {
            userAccessToken = response.authResponse.accessToken;
            userID = response.authResponse.userID;
            console.log("Session active, user ID:", userID);
        } else {
            console.log("User not logged in yet");
        }
    });
};

/* TODO: Custom share of scores (not only webpage share)

const playerName = "Jugador0";
const playerScore = 2500;
const gameName = "Across the Stars";
const shareLink = "https://cecil-untrailed-bifilarly.ngrok-free.dev/index.html";

document.getElementById('shareBtn').addEventListener('click', function () {
    if (!userAccessToken) {
        alert("Por favor inicia sesión en Facebook primero desde el menú principal.");
        return;
    }

    const message = `${playerName} consiguió ${playerScore} puntos en ${gameName}! ⭐`;

    FB.ui({
        method: 'share',
        href: shareLink,
        quote: message,
        hashtag: '#AcrossTheStars',
    }, function (response) {
        if (response && !response.error_message) {
            alert('¡Tu puntuación se publicó correctamente!');
        } else {
            console.error('Error al compartir:', response);
        }
    });
});
*/