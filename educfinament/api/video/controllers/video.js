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
    },

    async incrementaVisites(ctx) {
        return await strapi.services.video.findOne({'id':ctx.params.id}).then(async vid => {
            let registreVisita = {usuari: ctx.state.user.id, dataVisita: new Date()};

            return await strapi.query("registre-visita").create(registreVisita)
            .then(async newReg => {
                vid.copsVist += 1;
                if(vid.registresVisita == null || vid.registresVisita == undefined) vid.registresVisita = [];
                vid.registresVisita.push(newReg);
                await strapi.services.video.update({id:ctx.params.id},vid);

                return true;
            });
        });
    }
};
