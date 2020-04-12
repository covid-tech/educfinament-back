'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async update(ctx) {

        let dadesUpdate = {
            descripcio: ctx.request.body.descripcio,
            validat: ctx.request.body.validat,
            dataPublicacio: ctx.request.body.dataPublicacio,
            copsVist: ctx.request.body.copsVist,
            avaluacio: ctx.request.body.avaluacio
        }

        return await strapi.services.video.update(
          {id:ctx.params.id},
          dadesUpdate
        )
        .then(vid => { return vid; })
    }
};
