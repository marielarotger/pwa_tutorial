function registerPushNotificationHandler($ionicPopup) {

if ('serviceWorker' in navigator) {
    console.info('serviceWorker found, trying to register');

    // Esperamos a que termine de registrarse el sw
    // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready
    navigator.serviceWorker.ready
        .then(function(reg) {
            console.log('Service Worker is ready', reg);
            return reg.pushManager.subscribe({userVisibleOnly: true});
        })
        .then(function(subscription) {
            // en subscription tenemos los datos de la suscripción disponible
            // obtenemos los parámetros que necesitamos para enviar WebPush desde el backend
            // El código cubre los casos de Google y Firefox que usan formatos distintos.
            
            //From https://serviceworke.rs/push-payload_index_doc.html
            var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
            var key = rawKey ?
                btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) :
                '';
            var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
            var authSecret = rawAuthSecret ?
                        btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) :
                        '';

            var endpoint = subscription.endpoint;

            var gcm_registration_id_prefix = "https://android.googleapis.com/gcm/send/";
            var gcm_registration_id_prefix_index = endpoint.indexOf(gcm_registration_id_prefix);

            var moz_registration_id_prefix = "https://updates.push.services.mozilla.com/push/v1/";
            var moz_registration_id_prefix_index = endpoint.indexOf(moz_registration_id_prefix);

            var registration_id = {};
            if ( gcm_registration_id_prefix_index === 0 ) {
                registration_id.type = "gcm"
                registration_id.id = endpoint.substring(gcm_registration_id_prefix.length);
            } else if ( moz_registration_id_prefix_index === 0 ) {
                registration_id.type = "moz"
                registration_id.id = endpoint.substring(moz_registration_id_prefix.length);
            } else {
                console.warn('[PushNotificationService] No es GCM ni MOZ, ¿qué es?');
                registration_id.type = "unknown";
                registration_id.id = "42";
            }

            var deviceRegistrationRecord = {
                platform : 'webpush',
                endpoint : endpoint,
                registration_id : registration_id,
                key : key,
                authSecret : authSecret
            };

            console.log('deviceRegistrationRecord : ' , deviceRegistrationRecord);
            
            // Ahora registramos un listener que procesa las notificaciones que acepta el usuario
            //https://googlechrome.github.io/samples/service-worker/post-message/
            navigator.serviceWorker.addEventListener('message', function(event) {
                // Es un ServiceWorkerMessageEvent
                console.log("[navigator.serviceWorker.addEventListener] Llegó un evento del SW: ", event.data);
                // TODO Acá mostramos un alert, en una app normal ejecutaríamos otra lógica por ejemplo actualizando el contenido
                var alertPopup = $ionicPopup.alert({
                    title: 'Notificación procesada',
                    template: event.data.body
                });

                alertPopup.then(function(res) {
                    console.log('DONE');
                });
            
            });

        }).catch(function(e) {
            console.error('[PushNotificationService] Error during service worker registration:', e);
        });
} else {
    console.error('ServiceWorker not found');
}
}