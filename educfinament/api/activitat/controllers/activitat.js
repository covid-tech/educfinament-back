'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async find(ctx) {
        return await strapi.query("activitat").find({}, ['videos', 'participants','participants.rol','participants.participant']);
    }, 

    async findOne(ctx) {
        //return ctx.req.params
        return await strapi.query("activitat").findOne({id:ctx.params.id}, ['videos','participants','participants.rol','participants.participant']);
    },

    async create(ctx) {
        let codiAlumne = 0;
        let codiProfessor = 0;
        let act = null;

        while(codiAlumne == 0) {
            codiAlumne = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
            act = await strapi.services.activitat.findOne({codiInvitacioAlumne: codiAlumne.toString()});
            if(act != null && act != undefined) codiAlumne = 0;
        }

        while(codiProfessor == 0) {
            codiProfessor = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
            act = await strapi.services.activitat.findOne({codiInvitacioProfessor: codiProfessor.toString()});
            if(act != null && act != undefined) codiProfessor = 0;
        }

        ctx.request.body.codiInvitacioAlumne = codiAlumne.toString();
        ctx.request.body.codiInvitacioProfessor = codiProfessor.toString();
        console.log(ctx.request.body);
        return await strapi.services.activitat.create(ctx.request.body);
    },

    async update(ctx) {
        let dadesUpdate = {
            titol: ctx.request.body.titol,
            objectius: ctx.request.body.objectius,
            videoInici: ctx.request.body.videoInici,
            dataPublicacio: ctx.request.body.dataPublicacio,
            dataFinalitzacio: ctx.request.body.dataFinalitzacio,
            publicada: ctx.request.body.publicada,
            color: ctx.request.body.color,
            imatgeVideoInici: ctx.request.body.imatgeVideoInici,
            materials: ctx.request.body.materials,
            criterisAvaluacio: ctx.request.body.criterisAvaluacio,
            videoFi: ctx.request.body.videoFi,
            imatgeVideoFi: ctx.request.body.imatgeVideoFi,
            observacionsFi: ctx.request.body.observacionsFi,
            calValidacio: ctx.request.body.calValidacio,
            copsVista: ctx.request.body.copsVista
        }

        return await strapi.services.activitat.update(
          {id:ctx.params.id},
          dadesUpdate
        )
        .then(act => { return act; })
    },

    async pujaVideoActivitat(ctx) {
        return await strapi.services.video.create(ctx.request.body)
        .then(async vid => {
            let activitat = await strapi.services.activitat.findOne({id:ctx.params.id});
            if(ctx.params.tipus == "videoInici") activitat.videoInici = vid;
            else if(ctx.params.tipus == "videoFi") activitat.videoFi = vid;
            else {
                if(activitat.videos == null || activitat.videos == undefined) activitat.videos = [];
                activitat.videos.push(vid);
            }

            return await strapi.services.activitat.update({id:ctx.params.id}, activitat);
        });
    },

    async guardaNouConvidatActivitat(rol, act, usuari, ctx) {
        let participant = await strapi.query("rol-participant-activitat").findOne({activitat:act.id, participant: usuari, rol: rol.id})
        if(participant == null || participant == undefined) {
            return await strapi.query("rol-participant-activitat").create({activitat:act.id, participant: usuari, rol: rol.id})
            .then(async pra => {
                if(act.participants == null || act.participants == undefined) act.participants = [];
                act.participants.push(pra);
                return await strapi.services.activitat.update({id:act.id}, act);
            });
        } else ctx.response.badRequest("Usuari ja participant");
    },

    async apuntaActivitat(ctx) {
        let rol = null;

        return await strapi.services.activitat.findOne({'codiInvitacioAlumne':ctx.request.body.codiInvitacio})
        .then(async act => {
            // Si entre IF potser es Professor, sino és alumne
            if(act == null || act == undefined) {
                return await strapi.services.activitat.findOne({'codiInvitacioProfessor':ctx.request.body.codiInvitacio})
                .then(async act => {
                    if(act == null || act == undefined) ctx.response.badRequest("No s'ha trobat l'activitat");        
                    else {
                        rol = await strapi.query('role', 'users-permissions').findOne({name:'Professor'});
                        return await this.guardaNouConvidatActivitat(rol, act, ctx.request.body.usuari, ctx);
                    }
                });                
            } else {
                rol = await strapi.query('role', 'users-permissions').findOne({name:'Alumne'});
                return await this.guardaNouConvidatActivitat(rol, act, ctx.request.body.usuari, ctx);
            }
        });
    }
};
