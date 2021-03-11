export default function (app, method, route, promise, { auth, authOptional }) {
    app[method](route, function(req, res) {
        console.log(new Date().toISOString() + ' ' + method.toUpperCase() + '  ' + route);

        if (auth) {
            if(req.isAuthenticated || authOptional) {
                resolvePromiseAsResponse(req, res, promise);
                return;
            } else {
                console.log('Error: notAuthenticated');
                res.send({ error: 'You need to be logged in to do that' });
                return;
            }
        } else {
            resolvePromiseAsResponse(req, res, promise);
            return;
        }
    });
}

function resolvePromiseAsResponse(req, res, promise) {
    promise({ ...req.body, ...req.params }, req, res)
        .then((response) => {
            if (response && response.redirect) {
                res.redirect(302, response.redirect);
            } else {
                res.send(response);
            }

            return;
        })
        .catch(e => {
            console.error({ caughtError: e });

            res.status(e.status || 500);
            res.send({ error: 'There was an error' });
            return;
        });
}
