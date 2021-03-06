'use strict'; // JS: ES5

module.exports['imageUrl__to__imageStream'] = (imageUrl) => {
    return new Promise((resolve, reject) => {
        const request = require('request');
        request.get({
            url : imageUrl,
            encoding: null
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                return resolve(body.toString('base64'));
            }
            return reject(error || body);
        });
    });
};
module.exports['imageStream__to__paddedImageStream'] = (imageStream) => {
    if (!imageStream.match(/data:.*?;base64,.*/)) {
        imageStream = 'data:image/png;base64,' + imageStream;
    }
    return imageStream;
};
module.exports['imageStream__to__unpaddedImageStream'] = (imageStream) => {
    return imageStream.replace(/^data:.*?;base64,/,'');
};
module.exports['imageUrl__to__ascii'] = (imageUrl) => {
    const asciify = require('asciify-image');
    return new Promise((resolve, reject) => {
        asciify(imageUrl, {
            fit: 'box',
            width: 50,
            height: 50
        }, (err, converted) => {
            if (err) {
                return reject(err);
            }
            return resolve(converted);
        });
    });
};

module.exports['name__to__species'] = (name) => {
    name = name.trim().toLowerCase();

    if (['elephant', 'whale'].indexOf(name) >= 0) {
        return 'mammal';
    }
    if (['snake', 'crocodile'].indexOf(name) >= 0) {
        return 'reptile';
    }
    return 'dinosaur';
};
module.exports['mammal__to__description'] = (mammal, arms, legs) => {
    return `I have ${arms} arms and ${legs} legs`;
};
module.exports['reptile__to__description'] = (reptile, arms, legs) => {
    return `I am dangerous with my ${arms} arms and ${legs} legs`;
};