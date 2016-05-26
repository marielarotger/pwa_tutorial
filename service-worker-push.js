/*
 * Este script de Service Worker procesa los dos eventos principales: 
 * - llega una push notification
 * - el usuario la acepta haciendo click o tap en el aviso que le muestra el SO o browser
 * 
 */

// In a service worker, self refers to the ServiceWorkerGlobalScope object: the service worker itself.
// https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData
self.addEventListener('push', function(event) {
  console.log('Push message received', event);
  var title = 'Novedades en PWA';
  // Armamos el body ( texto del mensaje a mostrar en la notificación )
  var body = 'Hay nuevo contenido en PWA';
  if ( event.data && event.data.json()) {
      var eventData = event.data.json();
      body = eventData.body;
  }
  var data = event.data ? event.data.json() : 'no payload';
  event.waitUntil(
    // Mostramos la notificación.
    self.registration.showNotification(title, {
      body: body,
      icon: 'img/ionic.png',
      tag: 'generic_notification',
      data: data
    }));
});

/*
 * Este evento en enviado cuando el usuario clickea en la notificación
 * 
 */ 
self.addEventListener('notificationclick', function(event) {
    // https://developer.mozilla.org/en-US/docs/Web/API/NotificationEvent/notification
    console.log('Notification click: tag ', event.notification.tag);
    console.log('Notification click: data ', event.notification.data);
    //NOTE: Android doesn’t close the notification when you click it.
    //That’s why we need event.notification.close();.
    event.notification.close();

    event.waitUntil(
        // Un service worker puede atender varios clientes, acá buscamos las ventanas ( tabs y apps )
        // y enviamos un mensaje a cada una
        //https://developer.mozilla.org/en-US/docs/Web/API/Clients
        clients.matchAll({
            type: 'window'
        })
        .then(function(windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                console.log('client: ', JSON.stringify(client));
                // https://developer.mozilla.org/en-US/docs/Web/API/Client
                //
                // TODO Para no tener que hacer este broadcast, puedo usar ports como muestran en:
                // https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage
                client.postMessage(event.notification.data);
                // Activamos el tab de pwa
                if (client.url.indexOf("pwa") !== 0 ) {
                    return client.focus();
                }
            }
        })
    );
});