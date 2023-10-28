function handleNoFilterMatches(req, res, next) {
    try {
        if (typeof req.body.id !== 'undefined') {
            if (req.body.id.includes(':')) {
                const idParts = req.body.id.split(':');
                req.body.id = idParts[0];
                req.body.parent_id = idParts[1];
            }
        }
    } catch (e) {
        console.log(e);
    } finally {
        next();
    }
}
module.exports = handleNoFilterMatches;
