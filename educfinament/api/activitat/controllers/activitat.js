'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async find(ctx) {
        return await strapi.query("activitat").find({}, ['videos', 'alumne','alumne.rol','alumne.participant', 'professor','professor.rol','professor.participant']);
    }, 

    async findOne(ctx) {
        return await strapi.query("activitat").findOne({id:ctx.params.id}, [
            'videos','videoInici','videoFi','alumnes', 'professors', 'grup',
            'videos.enviatPer', 'videoInici.enviatPer', 'videoFi.enviatPer'
        ]).then(act => {
            let idAct = act.professors.findIndex(x => x.id == ctx.state.user.id);
            act.socProfessor = idAct > -1;
            return act;
        });
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
            criteriAvaluacioMoltBe: ctx.request.body.criteriAvaluacioMoltBe,
            criteriAvaluacioBe: ctx.request.body.criteriAvaluacioBe,
            criteriAvaluacioFluix: ctx.request.body.criteriAvaluacioFluix,
            criteriAvaluacioNoAssolit: ctx.request.body.criteriAvaluacioNoAssolit,
            videoFi: ctx.request.body.videoFi,
            imatgeVideoFi: ctx.request.body.imatgeVideoFi,
            observacionsFi: ctx.request.body.observacionsFi,
            calValidacio: ctx.request.body.calValidacio,
            esPrivada: ctx.request.body.esPrivada,
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

    async guardaInvitacioActivitat(act,socProfessor,ctx) {
        if(socProfessor) act.professors.push(ctx.request.body.usuari);
        else act.alumnes.push(ctx.request.body.usuari);

        return await strapi.services.activitat.update({id:act.id}, act).then(async newAct => {
            if(newAct.grup.alumnes == null || newAct.grup.alumnes == undefined)
                newAct.grup.alumnes = act.grup.alumnes;

            newAct.grup.alumnes.push(ctx.request.body.usuari);


            return await strapi.services.grup.update({id:newAct.grup.id}, newAct.grup).then(async newGrup => {
                if(newGrup.organitzacio.alumnes == null || newGrup.organitzacio.alumnes == undefined)
                    newGrup.organitzacio.alumnes = act.grup.organitzacio.alumnes;

                newGrup.organitzacio.alumnes.push(ctx.request.body.usuari);
                await strapi.services.organitzacio.update({id:newGrup.organitzacio.id}, newGrup.organitzacio)
                return newAct
            });
        });
    },

    async apuntaActivitat(ctx) {
        return await strapi.services.activitat.findOne({'codiInvitacioAlumne':ctx.request.body.codiInvitacio}, ["professors","alumnes",
            "grup", "grup.organitzacio", "grup.alumnes", "grup.professores", "grup.organitzacio.alumnes", "grup.organitzacio.professores"
        ]).then(async act => {
            // Si entre IF potser es Professor, sino és alumne
            if(act == null || act == undefined) {
                return await strapi.services.activitat.findOne({'codiInvitacioProfessor':ctx.request.body.codiInvitacio}, ["professors","alumnes",
                    "grup", "grup.organitzacio", "grup.alumnes", "grup.professores", "grup.organitzacio.alumnes", "grup.organitzacio.professores"
                ]).then(async act => {
                    if(act == null || act == undefined) ctx.response.badRequest("No s'ha trobat l'activitat");        
                    else {
                        if(act.professors == null || act.professors == undefined) act.professors = [];
                        return await this.guardaInvitacioActivitat(act,true,ctx); 
                    }
                });                
            } else {
                if(act.alumnes == null || act.alumnes == undefined) act.alumnes = [];
                return await this.guardaInvitacioActivitat(act,false,ctx); 
            }
        });
    }
};
